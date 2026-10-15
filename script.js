const attendanceGoal = 50;
const storageKey = "intel-sustainability-summit-attendees";
const teamDefinitions = {
  water: {
    name: "Team Water Wise",
    countElement: document.getElementById("waterCount"),
    cardElement: document.querySelector(".team-card.water")
  },
  zero: {
    name: "Team Net Zero",
    countElement: document.getElementById("zeroCount"),
    cardElement: document.querySelector(".team-card.zero")
  },
  power: {
    name: "Team Renewables",
    countElement: document.getElementById("powerCount"),
    cardElement: document.querySelector(".team-card.power")
  }
};
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const attendeeCountElement = document.getElementById("attendeeCount");
const attendanceGoalElement = document.getElementById("attendanceGoal");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.getElementById("progressBar");
const greetingElement = document.getElementById("greeting");
const celebrationElement = document.getElementById("celebration");
const attendeeList = document.getElementById("attendeeList");
const resetAttendanceButton = document.getElementById("resetAttendanceBtn");
let attendees = loadAttendees();

function isValidAttendee(attendee) {
  return (
    attendee !== null &&
    typeof attendee === "object" &&
    typeof attendee.name === "string" &&
    attendee.name.trim().length > 0 &&
    Object.prototype.hasOwnProperty.call(teamDefinitions, attendee.team)
  );
}

function loadAttendees() {
  let savedValue;

  try {
    savedValue = localStorage.getItem(storageKey);
  } catch (error) {
    console.error("Unable to load saved check-ins from localStorage.", error);
    return [];
  }

  if (savedValue === null) {
    return [];
  }

  try {
    const savedData = JSON.parse(savedValue);

    if (
      savedData === null ||
      typeof savedData !== "object" ||
      !Array.isArray(savedData.attendees) ||
      !savedData.attendees.every(isValidAttendee)
    ) {
      throw new Error("Saved check-in data has an invalid format.");
    }

    return savedData.attendees;
  } catch (error) {
    console.error("Unable to read saved check-ins.", error);
    return [];
  }
}

function saveAttendees() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ attendees: attendees }));
  } catch (error) {
    console.error("Unable to save check-ins to localStorage.", error);
  }
}

function updatePage() {
  const teamCounts = {
    water: 0,
    zero: 0,
    power: 0
  };

  for (const attendee of attendees) {
    teamCounts[attendee.team] += 1;
  }

  const totalAttendees = attendees.length;
  const progressPercentage = Math.min(
    (totalAttendees / attendanceGoal) * 100,
    100
  );

  attendeeCountElement.textContent = totalAttendees;
  attendanceGoalElement.textContent = attendanceGoal;
  progressBar.style.width = `${progressPercentage}%`;
  progressContainer.setAttribute("aria-valuemax", attendanceGoal);
  progressContainer.setAttribute("aria-valuenow", totalAttendees);
  progressContainer.setAttribute(
    "aria-valuetext",
    `${Math.round(progressPercentage)}% of attendance goal`
  );

  for (const teamKey of Object.keys(teamDefinitions)) {
    teamDefinitions[teamKey].countElement.textContent = teamCounts[teamKey];
    teamDefinitions[teamKey].cardElement.classList.remove("winner");
  }

  attendeeList.replaceChildren();

  for (const attendee of attendees) {
    const attendeeItem = document.createElement("li");
    attendeeItem.textContent = `${attendee.name} — ${teamDefinitions[attendee.team].name}`;
    attendeeList.appendChild(attendeeItem);
  }

  if (totalAttendees >= attendanceGoal) {
    const leadingTeamCount = Math.max(
      teamCounts.water,
      teamCounts.zero,
      teamCounts.power
    );
    const leadingTeams = Object.keys(teamDefinitions).filter(function (teamKey) {
      return teamCounts[teamKey] === leadingTeamCount;
    });
    const leadingTeamNames = leadingTeams.map(function (teamKey) {
      teamDefinitions[teamKey].cardElement.classList.add("winner");
      return teamDefinitions[teamKey].name;
    });

    celebrationElement.textContent =
      leadingTeamNames.length === 1
        ? `Goal reached! ${leadingTeamNames[0]} is leading.`
        : `Goal reached! ${leadingTeamNames.join(" and ")} are tied for the lead.`;
    celebrationElement.hidden = false;
  } else {
    celebrationElement.textContent = "";
    celebrationElement.hidden = true;
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const attendeeName = nameInput.value.trim();
  const selectedTeam = teamSelect.value;
  const hasValidTeam = Object.prototype.hasOwnProperty.call(
    teamDefinitions,
    selectedTeam
  );

  nameInput.setCustomValidity(
    attendeeName.length === 0 ? "Please enter an attendee name." : ""
  );
  teamSelect.setCustomValidity(
    hasValidTeam ? "" : "Please select a team."
  );

  if (attendeeName.length === 0 || !hasValidTeam) {
    form.reportValidity();
    return;
  }

  attendees.push({
    name: attendeeName,
    team: selectedTeam
  });

  greetingElement.textContent = `Welcome, ${attendeeName}! You’re checked in with ${teamDefinitions[selectedTeam].name}.`;
  greetingElement.classList.add("success-message");

  saveAttendees();
  updatePage();

  form.reset();
  nameInput.focus();
});

resetAttendanceButton.addEventListener("click", function () {
  const shouldReset = window.confirm(
    "Reset attendance and remove all saved check-ins?"
  );

  if (!shouldReset) {
    return;
  }

  attendees = [];
  greetingElement.textContent = "";
  greetingElement.classList.remove("success-message");
  form.reset();
  nameInput.setCustomValidity("");
  teamSelect.setCustomValidity("");
  saveAttendees();
  updatePage();
});

updatePage();