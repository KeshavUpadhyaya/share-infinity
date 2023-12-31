// nodejs server running on aws

// var wallet = require('./models/wallet');
// var rating = require('./models/rating');
// var completedTask = require('./models/completedTask');
// var task = require('./models/task');
// var systemInfo = require('./models/systemInfo');
// var PlatformProfit =  require('./models/platformProfit');

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("./_helpers/jwt");
const errorHandler = require("./_helpers/error-handler");

//Importing services
const userService = require("./services/user.service");
const taskService = require("./services/taskService");
const Provider = require("./models/provider");
const walletService = require("./services/wallet.service");
const chargeService = require("./services/charge.service");

//helpers
//const loadDatabase =  require('./_helpers/loadDatabase');
//loadDatabase.loadDatabase(); //do it only first time!

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api (disabled temporarily so that we need not send bearer token everytime )
//app.use(jwt());

//API routes

app.post("/api/v1/users/register", (req, res, next) => {
	userService
		.create(req.body)
		.then(() => res.json({ message: "success" }))
		.catch(err => next(err));
});

app.post("/api/v1/users/login", (req, res, next) => {
	userService
		.authenticate(req.body)
		.then(user =>
			user
				? res.json(user)
				: res
						.status(400)
						.json({ message: "userId or password is incorrect" })
		)
		.catch(err => next(err));
});

app.delete("/api/v1/users/:id", (req, res, next) => {
	userService
		.delete(req.params.id)
		.then(() => res.json({}))
		.catch(err => next(err));
});

//just for testing
app.get("/api/v1/users/:id", (req, res, next) => {
	userService
		.getById(req.params.id)
		.then(user => (user ? res.json(user) : res.sendStatus(404)))
		.catch(err => next(err));
});

app.get("/api/v1/providers/:cpu/:ram/:storage", (req, res, next) => {
	// console.log("get providers");
	taskService
		.getProviders(
			parseFloat(req.params.cpu),
			parseFloat(req.params.ram),
			parseFloat(req.params.storage)
		)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(err => next(err));
});

app.get("/api/v1/providers/:providerId/:state", (req, res, next) => {
	const providerId = req.params.providerId;
	const state = req.params.state;
	// console.log(providerId, state);
	Provider.findOne({ providerId: providerId })
		.then(provider => {
			// console.log(provider);
			if (state == "online") {
				provider.isOnline = true;
				provider.providerInUse = false;
				provider.isAssigned = false;
			} else {
				provider.isOnline = false;
				provider.providerInUse = false;
				provider.isAssigned = false;
			}
			provider.save();
		})
		.then(() => {
			res.sendStatus(200);
		})
		.catch(err => next(err));
});

app.get("/api/v1/providers/setIsAssigned/:providerId/:isAssigned", (req, res, next) => {
	const providerId = req.params.providerId;
	const isAssigned = req.params.isAssigned;
	// console.log(providerId, isAssigned);
	Provider.findOne({ providerId: providerId })
		.then(provider => {
			// console.log(provider);
			if(provider){
				if (isAssigned == "true") {
					provider.isAssigned = true;
				} else {
					provider.isAssigned = false;
				}
			}
			provider.save();
		})
		.then(() => {
			res.sendStatus(200);
		})
		.catch(err => next(err));
});

app.post("/api/v1/tasks", (req, res, next) => {
	taskService
		.createTask(req.body)
		.then(response => {
			// console.log(response);
			res.send(response);
		})
		.catch(err => {
			next(err);
		});
});

app.get("/api/v1/tasks/:userId/:type", (req, res, next) => {
	taskService
		.getTasks(req.params.userId, req.params.type)
		.then(response => {
			res.send(response);
		})
		.catch(err => next(err));
});

app.post("/api/v1/task/status", (req, res, next) => {
	taskService
		.updateTaskStatus(req.body)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(err => next(err));
});

app.get("/api/v1/task/status/:transactionId", (req, res, next) => {
	taskService
		.getTaskStatus(req.params.transactionId)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(error => next(error));
});

app.post("/api/v1/task/time", (req, res, next) => {
	taskService
		.setTaskTime(req.body)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(error => next(error));
});

app.get("/api/v1/task/time/:transactionId", (req, res, next) => {
	taskService
		.getTaskTime(req.params.transactionId)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(error => next(error));
});

app.post("/api/v1/task/cost", (req, res, next) => {
	taskService
		.setTaskCost(req.body)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(error => next(error));
});

app.post("/api/v1/task/fileIdentifier", (req, res, next) => {
	taskService
		.setFileIdentifier(req.body)
		.then(response => {
			response ? res.send(response) : res.sendStatus(400);
		})
		.catch(error => next(error));
});

app.get(
	"/api/v1/task/fileIdentifier/:type/:transactionId",
	(req, res, next) => {
		taskService
			.getFileIdentifier(req.params.transactionId, req.params.type)
			.then(response => {
				response ? res.send(response) : res.sendStatus(400);
			})
			.catch(error => next(error));
	}
);

app.post("/api/v1/polling", (req, res, next) => {
	// console.log("in polling")
	// console.log(req.body);
	const type = req.body.type;
	if(type === "taskRequired"){
		const userId = req.body.userId;
		taskService
			.getTaskAllocatedStatus(userId)
			.then(response => {
				// console.log(response);
				res.send(response);
			})
			.catch(error => next(error));
	}
	else if(type === "containerRunning") {
		taskService.setContainerStatus(req.body.transactionId,req.body.status).then(() => {
			res.sendStatus(200)
		})
			.catch(() => {
				res.sendStatus(400);
			})
	}

});



app.post("/api/v1/sysinfo", (req, res, next) => {
	taskService
		.updateSystemInfo(req.body)
		.then(() => res.json({ message: "success" }))
		.catch(err => next(err));
});

app.post("/api/v1/rating", (req, res, next) => {
	taskService
		.updateRatings(req.body)
		.then(() => res.json({ message: "rating updated successfully" }))
		.catch(err => next(err));
});

app.get("/api/v1/balance/:userId",(req,res,next) => {
	walletService.getBalance(req.params.userId)
		.then(response => res.send(response))
		.catch(err => next(err));
});

app.put("/api/v1/balance",(req,res,next) => {
	walletService.addBalance(req.body)
		.then(response => res.send(response))
		.catch(err => next(err));
});

app.post("/api/v1/pay",(req,res,next) => {
	walletService.makePayment(req.body).then(response => {
			if(response.error){
				res.send(response).sendStatus(400)
			}
			else
				res.send(response);
		}).catch(err => next(err));
});

app.get("/api/v1/charge/:userId",(req,res,next) => {
	chargeService.getProviderCharge(req.params.userId).then((response) => {
		res.send(response);
	}).catch(err => next(err));
});

app.put("/api/v1/charge",(req,res,next) => {
	chargeService.updateProviderCharge(req.body).then((response) => {
		res.send(response);
	})
		.catch(err => next(err));
});

// NOTE: the below middleware has to be applied after calling the api so do not move it
// global error handler
app.use(errorHandler);

// start server
const port = 8000;
app.listen(port, function() {
	console.log("Server listening on port " + port);
});
