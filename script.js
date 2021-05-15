let puppeteer = require("puppeteer");
const fs = require("fs");
const input = require("./input");
const cliProgress = require("cli-progress");
const _colors = require("colors");

let data = input.getData();
let id = data[0];
let pass = data[1];
let filePath = data[2];

let progressbar = new cliProgress.SingleBar({
	format:
		_colors.cyan(" {bar}") +
		" {percentage}% | {value}/{total} Questions Complete ",
	barCompleteChar: "\u2588",
	barIncompleteChar: "\u2591",
	hideCursor: true,
	barsize: 20,
});

let questionsFile = fs.readFileSync(filePath);
questionsFile = JSON.parse(questionsFile);

let formURL = "No Link Generated Some Problem Occurred";
try {
	createForm();
} catch (e) {
	console.log("Some Error Occurred");
	console.log(e.code);
}

async function createForm() {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		slowMo: 70,
	});
	const pages = await browser.pages();
	const page = pages[0];

	// login to google Account
	await googleLogin(page);

	// Create new Form button
	await page.waitForSelector(
		".docs-homescreen-templates-templateview-preview.docs-homescreen-templates-templateview-preview-showcase img"
	);
	await page.click(
		".docs-homescreen-templates-templateview-preview.docs-homescreen-templates-templateview-preview-showcase img"
	);

	await page.waitForNavigation({ waitUntil: "load" });
	// Set form title and description
	await setTitleAndDescription(page);

	// delete Initially created question box
	await DeletePreCreatedQuestion(page);
	console.log("\nForm Creation Started\n");
	progressbar.start(questionsFile.questions.length, 0);
	for (let x = 0; x < questionsFile.questions.length; x++) {
		// add new Question
		await page.waitForSelector(`[data-tooltip="Add question"]`, {
			visible: true,
		});
		await page.click(`[data-tooltip="Add question"]`);

		await page.waitForTimeout(50);
		// call to set data of question
		await setQuestionData(page, questionsFile.questions[x], x + 1);
		progressbar.update(x + 1);
	}
	progressbar.stop();
	// set form name
	await page.click(
		`#tJHJj > div.freebirdFormeditorViewHeaderTopRow > div.freebirdFormeditorViewHeaderLeft > div.freebirdFormeditorViewHeaderDocTitle.freebirdFormeditorViewHeaderInlineDocTitle.freebirdFormTitleInput > div.quantumWizTextinputSimpleinputEl.freebirdFormeditorViewHeaderTitleInput.hasValue > div > div.quantumWizTextinputSimpleinputContentArea > input`
	);

	await getFormLink(page);
	await browser.close();
	outputMessage();
}

async function DeletePreCreatedQuestion(page) {
	await page.click(".freebirdFormeditorViewItemContent");
	await page.click(`[data-action-id="freebird-delete-widget"]`);
	await page.waitForTimeout(100);
}

async function setTitleAndDescription(page) {
	await page.waitForSelector(`[aria-label="Form title"]`);
	await page.click(`[aria-label="Form title"]`);

	await page.waitForTimeout(10);
	// set Form Title
	await page.type(`[aria-label="Form title"]`, questionsFile.FormTitle);

	// Form description
	await page.click(`[aria-label="Form description"]`);
	await page.waitForTimeout(10);
	await page.type(
		`[aria-label="Form description"]`,
		questionsFile.FormDescription
	);
}

async function googleLogin(page) {
	await page.goto("https://www.google.com/forms/about/");
	await page.click(".mobile-device-is-hidden.js-dropdown-toggle");

	// type email in google login
	await page.waitForSelector('input[type="email"]');
	await page.click('input[type="email"]');
	await page.type('input[type="email"]', String(id));

	await page.waitForSelector("#identifierNext");
	await page.click("#identifierNext");
	await page.waitForNavigation({ waitUntil: "networkidle2" });
	await page.waitForTimeout(1000);

	// type password in google login
	await page.waitForSelector('input[type="password"]');
	await page.type('input[type="password"]', String(pass));
	await page.waitForSelector("#passwordNext");
	await page.click("#passwordNext");
}

async function setQuestionData(page, question, qNum) {
	await page.waitForTimeout(20);

	// Set question in focused Question block
	await page.click(
		`.appsMaterialWizTextinputTextareaEl.appsMaterialWizTextinputTextareaFilled.wrapping-text-input.freebirdThemedInput.freebirdCustomFont.noLabel.hasPlaceholder.appsMaterialWizTextinputTextareaAlwaysFloatLabel.isFocused [aria-label="Question title"]`
	);
	await page.type(
		`.appsMaterialWizTextinputTextareaEl.appsMaterialWizTextinputTextareaFilled.wrapping-text-input.freebirdThemedInput.freebirdCustomFont.noLabel.hasPlaceholder.appsMaterialWizTextinputTextareaAlwaysFloatLabel.isFocused [aria-label="Question title"]`,
		question.question
	);
	// click to question type selector
	await page.click(
		`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth > div:nth-child(1) > div.quantumWizMenuPaperselectOptionList`
	);
	await page.waitForTimeout(100);
	// call to select question type
	let isMCQ = false;
	try {
		isMCQ = await selectQuestionType(page, question.type, qNum);
	} catch (e) {
		console.log(e);
	}

	// call to set option if question contains option
	if (isMCQ)
		try {
			await setOptionsForMCQAndCheckBox(
				page,
				question.options,
				qNum,
				question.type
			);
		} catch (e) {
			console.log(e);
		}

	if (question.required)
		await page.click(
			`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div.itemShowOnExpand > div.itemHideInactive > div > div.freebirdFormeditorViewQuestionFooterFooterRight > div.freebirdFormeditorViewQuestionFooterRequiredToggleContainer`
		);
}

async function getFormLink(page) {
	await page.click(
		`#tJHJj > div.freebirdFormeditorViewHeaderTopRow > div.freebirdFormeditorViewHeaderRight > div > div:nth-child(5) > div > span`
	);
	await page.click(
		`#VVcGtd > div.quantumWizTabsPapertabsTabList.exportTabList.appsMaterialWizTabsPapertabsPrimaryTabList.freebirdFormeditorDialogSendformTabList > div:nth-child(3) > span > div`
	);

	await page.waitForTimeout(1000);
	await page.click(
		"#link > div > div > div:nth-child(2) > div > div > div.quantumWizTextinputPaperinputMainContent.exportContent > div > div.quantumWizTextinputPaperinputInputArea > input"
	);
	formURL = await page.$eval(
		`#link > div > div > div:nth-child(2) > div > div > div.quantumWizTextinputPaperinputMainContent.exportContent > div > div.quantumWizTextinputPaperinputInputArea > input`,
		(e) => e.value
	);
}

async function selectQuestionType(page, type, qNum) {
	/*
	Select the type of question depending upon the given type 
	! if the given type is invalid it will create a short answer question by default
	It will return true if question is contains options 
	*/
	type = type.toLowerCase();
	await page.waitForTimeout(100);

	switch (type) {
		case "short answer": {
			await page.click(
				`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth.isOpen > div.exportSelectPopup.quantumWizMenuPaperselectPopup.appsMaterialWizMenuPaperselectPopup > div:nth-child(1)`
			);
			break;
		}
		case "paragraph": {
			await page.click(
				`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth.isOpen > div.exportSelectPopup.quantumWizMenuPaperselectPopup.appsMaterialWizMenuPaperselectPopup > div:nth-child(2)`
			);
			break;
		}
		case "multiple choice": {
			await page.click(
				`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth.isOpen > div.exportSelectPopup.quantumWizMenuPaperselectPopup.appsMaterialWizMenuPaperselectPopup > div:nth-child(4)`
			);
			return true;
		}
		case "checkboxes": {
			await page.click(
				`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth.isOpen > div.exportSelectPopup.quantumWizMenuPaperselectPopup.appsMaterialWizMenuPaperselectPopup > div:nth-child(5)`
			);
			return true;
		}
		default: {
			await page.click(
				`#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div:nth-child(2) > div.itemShowOnExpand > div.freebirdFormeditorViewItemTitleRow > div.itemHideInactive > div > div.quantumWizMenuPaperselectEl.hasIcons.appsMaterialWizMenuPaperselectSelect.freebirdFormeditorViewItemTypechooserTypeChooserSelect.noMaxWidth.isOpen > div.exportSelectPopup.quantumWizMenuPaperselectPopup.appsMaterialWizMenuPaperselectPopup > div:nth-child(1)`
			);
		}
	}

	return false;
}

async function setOptionsForMCQAndCheckBox(page, options, qNum, type) {
	/**
	 * In this options for the given question get set according to given values
	 */

	for (let x = 0; x < options.length; x++) {
		let addOptionSelector = `#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div.itemShowOnExpand > div:nth-child(1) > div.freebirdFormeditorViewQuestionBodyQuestionBody.freebirdFormeditorViewQuestionBodyRadioBody > div > div.freebirdFormeditorViewQuestionBodyChoicelistbodyOmniList > div.itemHideInactive > div > div.quantumWizTextinputSimpleinputEl.docssharedWizOmnilistGhostitemInput.freebirdFormeditorViewOmnilistGhostitemInput.freebirdThemedInput > div > div.quantumWizTextinputSimpleinputContentArea > input`;

		let selector = `#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div.itemShowOnExpand > div:nth-child(1) > div.freebirdFormeditorViewQuestionBodyQuestionBody.freebirdFormeditorViewQuestionBodyRadioBody > div > div.freebirdFormeditorViewQuestionBodyChoicelistbodyOmniList > div:nth-child(1) > div:nth-child(${
			x + 1
		}) > div.docssharedWizOmnilistItemPrimaryContent.export-content > div.freebirdFormeditorViewOmnilistItemEditRegion > div.docssharedWizOmnilistMorselRoot.docssharedWizOmnilistMorselValue.freebirdFormeditorViewOmnilistItemValue > div`;

		if (type == "Checkboxes") {
			selector = `#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div.itemShowOnExpand > div:nth-child(1) > div.freebirdFormeditorViewQuestionBodyQuestionBody.freebirdFormeditorViewQuestionBodyCheckboxBody > div > div.freebirdFormeditorViewQuestionBodyChoicelistbodyOmniList > div:nth-child(1) > div:nth-child(${
				x + 1
			}) > div.docssharedWizOmnilistItemPrimaryContent.export-content > div.freebirdFormeditorViewOmnilistItemEditRegion > div.docssharedWizOmnilistMorselRoot.docssharedWizOmnilistMorselValue.freebirdFormeditorViewOmnilistItemValue > div > span > div > div > div.quantumWizTextinputSimpleinputContentArea > input`;

			addOptionSelector = `#SchemaEditor > div > div:nth-child(2) > div > div.freebirdFormeditorViewPagePageCard > div.item-dlg-dragContainer > div:nth-child(${qNum}) > div > div > div:nth-child(1) > div.freebirdFormeditorViewItemContent > div.itemShowOnExpand > div:nth-child(1) > div.freebirdFormeditorViewQuestionBodyQuestionBody.freebirdFormeditorViewQuestionBodyCheckboxBody > div > div.freebirdFormeditorViewQuestionBodyChoicelistbodyOmniList > div.itemHideInactive > div > div.quantumWizTextinputSimpleinputEl.docssharedWizOmnilistGhostitemInput.freebirdFormeditorViewOmnilistGhostitemInput.freebirdThemedInput > div > div.quantumWizTextinputSimpleinputContentArea > input`;
		}
		await page.click(selector);

		await page.keyboard.down("Control");
		await page.keyboard.press("A");
		await page.keyboard.press("Backspace");
		await page.keyboard.up("Control");

		await page.type(selector, options[x]);

		if (x != options.length - 1) {
			// add next option
			// console.log("added");
			await page.click(addOptionSelector);
		}
	}
}

function outputMessage() {
	console.log("\n!! Form is Created !!\n");
	console.log("\nForm Link: ");
	console.log(formURL);
}
