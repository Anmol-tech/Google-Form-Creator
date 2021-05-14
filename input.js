const prompt = require("prompt-sync")({ sigint: true });
const validator = require("./validator");
module.exports = { getData };

function getData() {
	let email = prompt("Enter your Email: ");
	let pass = prompt("Enter Password: ");
	let filePath = prompt("Enter FilePath or FileName: ");

	validator.emailPasswordValidator(email, pass);
	return [email, pass, filePath];
}

