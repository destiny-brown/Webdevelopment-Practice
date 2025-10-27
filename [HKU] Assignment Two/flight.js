/*
Async fetch request function to get the php data
Return as json data for easier processing
 */
async function fetchFlightInfo() {
    try {
        let response = await fetch('flight.php');
        if (response.status == 200) {
            let data = await response.json();
            var flightData = JSON.stringify(data);

            document.getElementById("dateHeader").textContent = `Flight Statistics on ${data.date}`;

            // Separate departures and arrivals
            const departures = data.flights.filter(f => f.type === "departure");
            const arrivals = data.flights.filter(f => f.type === "arrival");

            // Count totals
            const totalDepartures = departures.length;
            const totalArrivals = arrivals.length;

            document.getElementById("flightCounts").textContent =
                `Total Departures: ${totalDepartures}, Total Arrivals: ${totalArrivals}`;

            // Unique IATA codes
            const uniqueDestinations = new Set(departures.map(f => f.destination));
            const uniqueOrigins = new Set(arrivals.map(f => f.origin));

            document.getElementById("iataCounts").textContent =
                `Unique Destinations: ${uniqueDestinations.size}, Unique Origins: ${uniqueOrigins.size}`;

            // Optional: show raw data
            document.getElementById('flightInfo').textContent = JSON.stringify(data, null, 2);
        } else {
            console.log("HTTP return status: " + response.status);
        }
    } catch (err) {
        console.log("Fetch Error for flight data!");
    }
}


// Async fetch from iata.json. Also store as a json data for easier processing
async function fetchIataInfo() {
    try {
        let response = await fetch('iata.json');
        if (response.status == 200) {
            let data = await response.json();
            var iataData = JSON.stringify(data);
            // Process your IATA data here
            document.getElementById('iataInfo').innerHTML = iataData;
        } else {
            console.log("HTTP return status: " + response.status);
        }
    } catch(err) {
        console.log("Fetch Error for IATA data!");
    }
}


// //Addressing the date picker task:
document.addEventListener("DOMContentLoaded", function () {
    const flightDateInput = document.getElementById("flightDate");

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 91);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    flightDateInput.min = formatDate(startDate);
    flightDateInput.max = formatDate(endDate);

    //if user did not select or enter a date and clicked search button

    document.getElementById("InputForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Always prevent default first
        const flightDateInput = document.getElementById("flightDate");
        const alertMessage = document.getElementById("alertMessage");

        if (!flightDateInput.value) {
            alertMessage.textContent = "Please enter a day for the search";
            flightDateInput.setCustomValidity("Please enter a valid flight date.");
            flightDateInput.reportValidity();
            return; // Stop further execution
        }

        // Valid input: proceed
        alertMessage.textContent = "";
        flightDateInput.setCustomValidity("");

        const selectedDate = flightDateInput.value;
        flightDateInput.value = "";

        // Perform AJAX requests
        fetchFlightInfo();
        fetchIataInfo();

        // Optional: confirmation
        alert(`Searching flights for: ${selectedDate}`);
    });
});




