const config  = require('../config/config');
const db =  require('../_helpers/db');
const User = db.User;
const Provider = db.Provider;
const SystemInfo = db.SystemInfo;
const Task = db.Task;

async function getProviders(minCpu,minRam,minStorage){

    return Provider.find({$and: [
            {isOnline : { $eq: true}},
            {isAssigned: {$eq:false}}
        ]}).then( (docs) => {
            const providerIds = [];
            docs.forEach((provider) => providerIds.push(provider.providerId));
              return SystemInfo.find({userId: { $in : providerIds} })
                  .then((systemsInfos) => {
                      const result = {"providers":[]};
                      const matchedSystems = systemsInfos.filter((systemInfo) =>{
                          return systemInfo.ram>=minRam && systemInfo.cpuCores>= minCpu && systemInfo.storage >= minStorage});
                      matchedSystems.forEach((system) => {
                          result["providers"].push({
                              ["providerId"]: system.userId,
                              ["ram"]:system.ram,
                              ["cpu"]:system.cpuCores,
                              ["storage"]:system.storage
                          })
                      })
                      return result;
                  })

        })
}

async function createTask({userId,providerId}){
   return Task.create({consumerId: userId,providerId:providerId,isContainerRunning:false,isCompleted:false,startTime:null,endTime:null,cost:null})
        .then((response)=>{
        return {
            ['transactionId']:response.transactionId,
            ['providerId']:providerId
        }
    })
        .catch(err => {
            return err;
        });

}

async function getTasks(userId,type){
    const key = type === "consumer" ? "consumerId" : "providerId";
    return Task.find({[key]: {$eq : userId} })
        .then(async (tasks) => {
            const result = []
            for (const task of tasks) {
               let taskItem = {};
                taskItem = {
                    ['userId']: type==="consumer" ? task.providerId : task.consumerId,
                    ['transactionId']: task.transactionId,
                    ['status'] : "running"
                }
               if(task.isCompleted){
                   await db.CompletedTasks.findOne({transactionId: task.transactionId})
                       .then((completedTask) => {
                           taskItem['status'] = completedTask.status ? "completed": "failed" ;
                           taskItem['rating'] = completedTask.rating;
                           taskItem['cost'] = completedTask.cost;
                       });
               }
               result.push(taskItem);
            }
            return result;
        })
        .catch(err => err);
}

module.exports = {
    getProviders,
    createTask,
    getTasks
}
