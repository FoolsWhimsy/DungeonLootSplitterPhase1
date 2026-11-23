const loot = [];
let splitYet = false;

// Creates an internal representation of the money in cents so 0.1 + 0.2 style drift never reaches the screen.
function toCents(amount) {
    return Math.round(amount * 100);
}

// Rounds to two decimal places
function formatMoney(amount) {
    return "$" + amount.toFixed(2);
}

// Error handling message
function setMessage(element, text, isError) {
    element.textContent = text;
    element.classList.toggle("error", Boolean(isError));
    element.classList.toggle("success", !isError && text !== "");
}

// Returns a whole number >= 1 or null if the field is empty or invalid
function getPartySize() {
    const RAW = document.getElementById("partySize").value.trim();
    if (RAW === "") {
        return null;
    }
    const SIZE = Number(RAW);
    if (!Number.isFinite(SIZE) || !Number.isInteger(SIZE) || SIZE < 1) {
        return null;
    }
    return SIZE;
}

// Sets up a loop to get total loot
function getTotalLoot() {
    let cents = 0;
    for (let i = 0; i < loot.length; i++) {
        cents += toCents(loot[i].value);
    }
    return cents / 100;
}

// Handles updating the totals when new items are added and formatted correctly
function updateTotals() {
    const TOTAL = getTotalLoot();
    const TOTAL_EL = document.getElementById("lootTotal");
    const SPLIT_TOTAL_EL = document.getElementById("splitTotal");
    const PER_MEMBER_EL = document.getElementById("perMember");

    // Total loot is displayed from the same calc
    TOTAL_EL.textContent = formatMoney(TOTAL);
    SPLIT_TOTAL_EL.textContent = formatMoney(TOTAL);

    const PARTY = getPartySize();

    // Auto-recalculation whenever a split finishes and keeps the format
    if (splitYet && PARTY !== null && loot.length > 0) {
        const CENTS = toCents(TOTAL);
        PER_MEMBER_EL.textContent = formatMoney(Math.floor(CENTS / PARTY) / 100);
    } else {
        PER_MEMBER_EL.textContent = "\u2014";
    }
}

function renderLoot() {
    const LIST = document.getElementById("lootList");
    const EMPTY = document.getElementById("emptyLoot");

    LIST.textContent = "";

    const FRAGMENT = document.createDocumentFragment();
    for (let i = 0; i < loot.length; i++) {
        const ITEM = loot[i];

        const ROW = document.createElement("li");
        ROW.className = "loot-item";

        const NAME = document.createElement("span");
        NAME.className = "loot-name";
        NAME.textContent = ITEM.name;

        const VALUE = document.createElement("span");
        VALUE.className = "loot-value";
        VALUE.textContent = formatMoney(ITEM.value);

        const REMOVE_BUTTON = document.createElement("button");
        REMOVE_BUTTON.type = "button";
        REMOVE_BUTTON.className = "button remove-btn";
        REMOVE_BUTTON.textContent = "\u2715";
        REMOVE_BUTTON.setAttribute("aria-label", "Remove " + ITEM.name);
        REMOVE_BUTTON.addEventListener("click", createRemoveHandler(i));

        ROW.appendChild(NAME);
        ROW.appendChild(VALUE);
        ROW.appendChild(REMOVE_BUTTON);
        FRAGMENT.appendChild(ROW);
    }
    LIST.appendChild(FRAGMENT);

    EMPTY.hidden = loot.length > 0;

    updateTotals();
}

function createRemoveHandler(index) {
    return function () {
        removeLoot(index);
    };
}

function addLoot() {
    const NAME_INPUT = document.getElementById("lootName");
    const VALUE_INPUT = document.getElementById("lootValue");
    const MESSAGE = document.getElementById("lootMessage");

    const NAME = NAME_INPUT.value.trim();
    const RAW_VALUE = VALUE_INPUT.value.trim();

    if (NAME === "") {
        setMessage(MESSAGE, "Enter a loot name before adding the item.", true);
        NAME_INPUT.focus();
        return;
    }
    if (RAW_VALUE === "") {
        setMessage(MESSAGE, "Enter a loot value, for example 5.50.", true);
        VALUE_INPUT.focus();
        return;
    }

    const VALUE = Number(RAW_VALUE);
    if (!Number.isFinite(VALUE)) {
        setMessage(MESSAGE, "\"" + RAW_VALUE + "\" is not a valid number. Use digits only, for example 5.50.", true);
        VALUE_INPUT.focus();
        return;
    }

    if (VALUE < 0) {
        setMessage(MESSAGE, "Loot value cannot be negative. Enter 0 or more.", true);
        VALUE_INPUT.focus();
        return;
    }

    loot.push({ name: NAME, value: toCents(VALUE) / 100 });
    NAME_INPUT.value = "";
    VALUE_INPUT.value = "";
    NAME_INPUT.focus();

    renderLoot();
    setMessage(MESSAGE, "Added \"" + NAME + "\" for " + formatMoney(toCents(VALUE) / 100) + ".", false); // FIX 5
}

function removeLoot(index) {
    if (index < 0 || index >= loot.length) {
        return;
    }
    const REMOVED = loot[index];
    loot.splice(index, 1);

    if (loot.length === 0) {
        splitYet = false;
        setMessage(document.getElementById("splitMessage"), "", false);
    }

    renderLoot();
    setMessage(document.getElementById("lootMessage"), "Removed \"" + REMOVED.name + "\".", false);
}

function splitLoot() {
    const MESSAGE = document.getElementById("splitMessage");
    const TOTAL = getTotalLoot();
    const PARTY = getPartySize();

    if (PARTY === null) {
        setMessage(MESSAGE, "Enter a whole-number party size of 1 or more before splitting.", true);
        document.getElementById("partySize").focus();
        return;
    }

    if (loot.length === 0) {
        setMessage(MESSAGE, "Add at least one loot item before splitting the hoard.", true);
        document.getElementById("lootName").focus();
        return;
    }

    const TOTAL_CENTS = toCents(TOTAL);
    const BASE_CENTS = Math.floor(TOTAL_CENTS / PARTY);
    const REMAINDER_CENTS = TOTAL_CENTS - BASE_CENTS * PARTY;

    splitYet = true;
    updateTotals();

    let text = "Split " + formatMoney(TOTAL) + " among " + PARTY +
        (PARTY === 1 ? " member: " : " members: ") +
        formatMoney(BASE_CENTS / 100) + " each.";

    if (REMAINDER_CENTS > 0) {
        text += " " + formatMoney(REMAINDER_CENTS / 100) +
            " cannot be divided evenly \u2014 hand it to one member as a finder's bonus.";
    }

    setMessage(MESSAGE, text, false);
}

function handleLootEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addLoot();
    }
}

document.getElementById("addLoot").addEventListener("click", addLoot);
document.getElementById("splitLoot").addEventListener("click", splitLoot);
document.getElementById("lootName").addEventListener("keydown", handleLootEnter);
document.getElementById("lootValue").addEventListener("keydown", handleLootEnter);

renderLoot();