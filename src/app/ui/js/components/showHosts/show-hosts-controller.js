export default class showHostsController {
	static get $inject() {
		return [
			"authService",
			"taskService",
			"$location",
			"$timeout",
			"$mdDialog"
		];
	}

	constructor(authService, taskService, $location, $timeout, $mdDialog) {
		this.authService = authService;
		this.taskService = taskService;
		this.$location = $location;
		this.$timeout = $timeout;
		this.$mdDialog = $mdDialog;
		this.selection = [];
		this.submittedProviders = [];
		this.status = "0";

		this.getHosts();
		this.currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
		this.userId = this.currentUser.userId;
		console.log(this.providers);
	}

	showAlert(transactionId) {
		const ctrl = this;
		// Appending dialog to document.body to cover sidenav in docs app
		// Modal dialogs should fully cover application
		// to prevent interaction outside of dialog
		this.$mdDialog.show(
			ctrl.$mdDialog
				.alert()
				.parent(angular.element(document.body))
				.clickOutsideToClose(true)
				.title("Submitted Successfully!")
				.textContent(`Transaction ID : ${transactionId}`)
				.ariaLabel("Alert success")
				.ok("OK")
		);
	}

	toggleSelection(userId) {
		console.log(userId);
		var idx = this.selection.indexOf(userId);

		if (idx > -1) {
			this.selection.splice(idx, 1);
		} else {
			this.selection.push(userId);
		}

		console.log(this.selection);
	}

	submitTask(providerId) {
		const ctrl = this;
		const myproviderId = providerId;
		console.log(this.submittedProviders);
		this.taskService.submitTask(this.userId, providerId).then(
			function(response) {
				// console.log(ctrl);
				// console.log(ctrl.submittedProviders);
				ctrl.submittedProviders.push(myproviderId);

				const transactionId = response.data.transactionId;
				// alert(
				// 	"Task submitted successfully with transactionId : " +
				// 		transactionId
				// );

				ctrl.showAlert(transactionId);

				const filePath = document.getElementById(
					"filepath_" + myproviderId
				).value;
				console.log(filePath);

				const commandsToRun = document.getElementById(
					"commands_" + myproviderId
				).value;

				console.log(commandsToRun);

				ctrl.taskService
					.createDockerfile(transactionId, commandsToRun, filePath)
					.then(
						function(response) {
							console.log(response.data);
						},
						function(err) {
							console.log(err);
						}
					);
			},
			function() {
				"failed to submit task";
			}
		);
	}

	getHosts() {
		const ctrl = this;
		const config = JSON.parse(sessionStorage.getItem("config"));
		this.taskService
			.getProviders(config.ram, config.cpuCores, config.storage)
			.then(
				function(response) {
					ctrl.providers = response.data.providers;
				},
				function(err) {
					console.log("Some error!");
				}
			);
	}
}
