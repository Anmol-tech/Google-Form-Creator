module.exports = { emailPasswordValidator };

function emailPasswordValidator(id, pass) {
	// checkFilePath(filePath);

	let msg = "";
	let checkUser = checkUserName(id);
	let checkPass = checkPassword(pass);

	if (!checkUser && !checkPass) {
		msg = "Username and Password";
	} else if (!checkUser) {
		msg = "Username";
	} else if (!checkPass) {
		msg = "Password";
	}
	if (msg != "") {
		msg += " is Not valid ";
		console.log("\n\n !! " + msg + " !!");
		console.log("\n !! Try again with valid credentials !!");
		process.exit();
	}
}

function checkUserName(username) {
	if (username.length < 6 || username.length > 30) {
		return false;
	}
	return true;
}

function checkPassword(password) {
	if (password.length < 8) {
		return false;
	}
	let countLetters = 0,
		countNumbers = 0,
		countSymbols = 0;

	const punct = "!,;.-?@#$%^&*():<>/";
	const numbers = "1234567890";
	const alphabets = "abcdefghijklmnopqurstuvxyz";

	for (let i = 0; i < password.length; i++) {
		let ele = password[i];

		if (punct.includes(ele)) {
			countSymbols++;
		} else if (numbers.includes(ele)) {
			countNumbers++;
		} else if (alphabets.includes(ele)) {
			countLetters++;
		}
	}
	if (countLetters >= 1 && countNumbers >= 1 && countSymbols >= 1) {
		return true;
	} else {
		return false;
	}
}

