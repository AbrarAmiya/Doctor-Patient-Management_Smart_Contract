App = {
    webProvider: null,
    contracts: {},
    account: '0x0',
    web3: null,
    patients: {}, // Dictionary to store patient data locally
    doctors: {}, // Dictionary to store doctor data locally
    appointments: [], // Array to store appointment data locally

    initWeb: async function () {
        if (window.ethereum) {
            try {
                App.web3 = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                App.account = accounts[0];
            } catch (error) {
                if (error.code === 4001) {
                    alert('MetaMask connection request was denied.');
                } else {
                    console.error('Error connecting to MetaMask:', error);
                }
            }

            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    alert('Please connect to MetaMask.');
                } else {
                    App.account = accounts[0];
                    $("#accountAddress").html(`Connected account: ${App.account}`);
                    await App.initContract();
                }
            });
        } else {
            alert('Please install MetaMask to use this application.');
        }
        return App.initContract();
    },

    initContract: async function () {
        try {
            const response = await fetch('Election.json'); // Replace with actual ABI path
            const ElectionABI = await response.json();
            App.contracts.Election = TruffleContract(ElectionABI);
            App.contracts.Election.setProvider(App.web3.currentProvider);
            App.contract = await App.contracts.Election.deployed();
        } catch (error) {
            console.error('Error initializing contract:', error);
            alert('Failed to load the smart contract. Check the deployment.');
        }
        return App.render();
    },

    render: async function () {
        $("#accountAddress").html(`Connected account: ${App.account}`);
    },

    // Patient Registration
    registerPatient: async function () {
        const age = $("#patientAge").val();
        const gender = $("#patientGender").val();
        const district = $("#patientDistrict").val();
        const symptoms = $("#patientSymptoms").val();

        try {
            const contractInstance = await App.contracts.Election.deployed();
            await contractInstance.registerPatient(age, gender, district, symptoms, { from: App.account });

            // Add patient to local dictionary
            App.patients[App.account] = {
                id: Object.keys(App.patients).length + 1,
                age: Number(age),
                gender,
                district,
                symptoms,
                patientAddress: App.account,
            };

            alert('Patient registered successfully!');
        } catch (error) {
            if (error.code === 4001) {
                alert('Transaction rejected by user.');
            } else {
                console.error('Error registering patient:', error);
                alert('An error occurred while registering the patient.');
            }
        }
    },
assignAdmin: async function () {
    try {
        const contractInstance = await App.contracts.Election.deployed();

        // Fetch the current admin from the contract
        const currentAdmin = await contractInstance.admin();

        // Check if an admin is already assigned
        if (currentAdmin !== "0x0000000000000000000000000000000000000000") {
            alert(`Admin is already assigned to: ${currentAdmin}`);
            $("#adminStatus").html(`Admin: ${currentAdmin}`);
            return;
        }

        // Assign the currently selected MetaMask account as admin
        await contractInstance.setAdmin(App.account, { from: App.account });

        // Update the frontend to reflect the new admin
        $("#adminStatus").html(`Admin assigned: ${App.account}`);
        alert(`Admin successfully assigned to: ${App.account}`);
    } catch (error) {
        if (error.code === 4001) {
            alert("Transaction rejected by user.");
        } else {
            console.error("Error assigning admin:", error);
            alert("An error occurred while assigning the admin.");
        }
    }
},

	



 loadPatients: function () {
    let html = '<h4>Patients:</h4><ul>';
    const ages = []; // Array for age calculations

    if (Object.keys(App.patients).length === 0) {
        html += '<li>No patients registered yet.</li>';
    } else {
        for (const [address, patient] of Object.entries(App.patients)) {
            ages.push(patient.age); // Collect age for calculations
            const vaccineStatus = ["NOT_VACCINATED", "ONE_DOSE", "TWO_DOSE"][patient.vaccine_status];
            const isDead = patient.is_dead ? "Yes" : "No";

            html += `<li>
                        ID: ${patient.id}, 
                        Age: ${patient.age}, 
                        Gender: ${patient.gender}, 
                        District: ${patient.district}, 
                        Vaccine Status: ${vaccineStatus}, 
                        Is Deceased: ${isDead}, 
                        Address: ${address}
                     </li>`;
        }
    }

    $('#patientsList').html(html);

    // Generate the Covid Trend Table
    App.generateCovidTrendTable(ages);
},


    // Doctor Registration
registerDoctor: async function () {
    const name = $("#doctorName").val();
    const specialization = $("#doctorSpecialization").val();

    try {
        const contractInstance = await App.contracts.Election.deployed();
        await contractInstance.registerDoctor(name, specialization, { from: App.account });

        // Add doctor to local dictionary
        if (!App.doctors[App.account]) {
            App.doctors[App.account] = {
                id: Object.keys(App.doctors).length + 1, // Generate a new ID
                name, // Store the doctor's name
                specialization, // Store the specialization
                doctorAddress: App.account, // Store the Ethereum address
            };
        }

        console.log("Doctor registered:", App.doctors[App.account]); // Debugging log
        alert("Doctor registered successfully!");
    } catch (error) {
        if (error.code === 4001) {
            alert("Transaction rejected by user.");
        } else {
            console.error("Error registering doctor:", error);
            alert("An error occurred while registering the doctor.");
        }
    }
},
updatePatient: async function () {
    const patientAddress = $("#updatePatientAddress").val(); // Address of the patient to update
    const vaccineStatus = $("#updateVaccineStatus").val();  // New vaccine status
    const isDeceased = $("#isDead").is(":checked");         // Deceased status (true/false)

    try {
        const contractInstance = await App.contracts.Election.deployed();

        // Verify if the current account is the admin
        const currentAdmin = await contractInstance.admin();
        if (currentAdmin.toLowerCase() !== App.account.toLowerCase()) {
            alert("Only the admin can update patient information.");
            return;
        }

        // Call the contract's function to update patient data
        await contractInstance.updatePatientData(patientAddress, vaccineStatus, isDeceased, {
            from: App.account,
        });

        // Update the local cache
        if (App.patients[patientAddress]) {
            App.patients[patientAddress].vaccine_status = Number(vaccineStatus);
            App.patients[patientAddress].is_dead = isDeceased;
        }

        alert("Patient information updated successfully!");

        // Reload patients to reflect updated values
        App.loadPatients();
    } catch (error) {
        console.error("Error updating patient information:", error);
        alert("An error occurred while updating the patient information.");
    }
},




    loadDoctors: function () {
        let html = '<h4>Doctors:</h4><ul>';

        if (Object.keys(App.doctors).length === 0) {
            html += '<li>No doctors registered yet.</li>';
        } else {
            for (const [address, doctor] of Object.entries(App.doctors)) {
                html += `<li>
                            ID: ${doctor.id}, 
                            Name: ${doctor.name}, 
                            Specialization: ${doctor.specialization}, 
                            Address: ${address}
                         </li>`;
            }
        }

        $('#doctorsList').html(html);
    },

    // Appointment Booking
bookAppointment: async function () {
    const doctor = $("#appointmentDoctor").val(); // Doctor's address
    const timeSlot = $("#appointmentSlot").val(); // Selected time slot

    console.log("Booking Appointment - Doctor:", doctor);
    console.log("Booking Appointment - TimeSlot:", timeSlot);

    try {
        const feeInWei = (0.01 * 1e18).toString();
        console.log("Fee in Wei:", feeInWei);

        const contractInstance = await App.contracts.Election.deployed();
        console.log("Contract Instance:", contractInstance);

        // Call the smart contract's bookAppointment function
        await contractInstance.bookAppointment(doctor, timeSlot, {
            from: App.account,
            value: feeInWei,
        });

        App.appointments.push({
            patient: App.account,
            doctor: doctor,
            timeSlot: timeSlot,
        });

        alert("Appointment booked successfully!");
    } catch (error) {
        console.error("Error booking appointment:", error);
        if (error.code === 4001) {
            alert("Transaction rejected by user.");
        } else {
            alert("An error occurred while booking the appointment.");
        }
    }
},
loadAllAppointments: async function () {
    try {
        const contractInstance = await App.contracts.Election.deployed();
        const appointments = await contractInstance.getAllAppointments();

        const patients = appointments[0];
        const timeSlots = appointments[1];
        const doctors = appointments[2];

        const appointmentsByDoctor = {}; // Group appointments by doctor address

        // Organize appointments by doctor
        for (let i = 0; i < doctors.length; i++) {
            const doctorAddress = doctors[i];

            // Ensure doctor exists in local dictionary
            if (!appointmentsByDoctor[doctorAddress]) {
                appointmentsByDoctor[doctorAddress] = [];
            }

            // Add appointment details
            appointmentsByDoctor[doctorAddress].push({
                patient: patients[i],
                timeSlot: timeSlots[i],
            });
        }

        let html = '<h4>All Appointments:</h4>';

        // Generate HTML for each doctor and their appointments
        for (const [doctorAddress, appointments] of Object.entries(appointmentsByDoctor)) {
            const doctor = App.doctors[doctorAddress]; // Retrieve doctor details
            const doctorName = doctor ? doctor.name : "Unknown Doctor";
            const specialization = doctor ? doctor.specialization : "Unknown Specialization";

            html += `<h5>Doctor: ${doctorName} (${doctorAddress})</h5>`;
            html += `<p>Specialization: ${specialization}</p>`;
            html += '<ul>';
            appointments.forEach((appointment) => {
                html += `<li>
                            Patient: ${appointment.patient}, 
                            Time Slot: ${appointment.timeSlot}
                         </li>`;
            });
            html += '</ul>';
        }

        if (Object.keys(appointmentsByDoctor).length === 0) {
            html = '<p>No appointments found.</p>';
        }

        $('#allAppointmentsList').html(html);
    } catch (error) {
        console.error("Error loading appointments:", error);
        alert("An error occurred while fetching appointments.");
    }
},







    loadAppointments: function () {
        let html = '<h4>Appointments:</h4><ul>';

        if (App.appointments.length === 0) {
            html += '<li>No appointments booked yet.</li>';
        } else {
            for (const appointment of App.appointments) {
                html += `<li>
                            Patient: ${appointment.patient}, 
                            Doctor: ${appointment.doctor}, 
                            Time Slot: ${appointment.timeSlot}
                         </li>`;
            }
        }

        $('#appointmentsList').html(html);
    },
    
   renderAdmin: async function () {
    try {
        const contractInstance = await App.contracts.Election.deployed();

        // Fetch the current admin
        const currentAdmin = await contractInstance.admin();

        if (currentAdmin !== "0x0000000000000000000000000000000000000000") {
            $("#adminStatus").html(`Admin: ${currentAdmin}`);
        } else {
            $("#adminStatus").html("No admin assigned yet.");
        }
    } catch (error) {
        console.error("Error fetching admin:", error);
        alert("Failed to fetch admin information.");
    }
},
verifyAdmin: async function () {
    try {
        const contractInstance = await App.contracts.Election.deployed();
        const currentAdmin = await contractInstance.admin();
        console.log("Admin Address in Contract:", currentAdmin);
        console.log("Selected MetaMask Account:", App.account);

        if (currentAdmin.toLowerCase() === App.account.toLowerCase()) {
            alert("You are the admin.");
            $("#adminStatus").html(`Admin: ${currentAdmin}`);
        } else {
            alert(`Only the admin can perform this action. Admin: ${currentAdmin}`);
        }
    } catch (error) {
        console.error("Error verifying admin:", error);
        alert("Failed to verify admin. Check the console for details.");
    }
},




    generateCovidTrendTable: function (ages) {
        if (ages.length === 0) {
            $('#covidTrendTable').html('<p>No patients registered yet.</p>');
            return;
        }

        // Sort ages
        ages.sort((a, b) => a - b);

        // Calculate Median
        const n = ages.length;
        let median;
        if (n % 2 === 1) {
            median = ages[Math.floor(n / 2)];
        } else {
            median = (ages[n / 2 - 1] + ages[n / 2]) / 2;
        }

        // Calculate Age Group Percentages
        let children = 0, teenagers = 0, young = 0, elder = 0;
        for (const age of ages) {
            if (age < 13) children++;
            else if (age >= 13 && age < 20) teenagers++;
            else if (age >= 20 && age < 50) young++;
            else elder++;
        }

        const total = ages.length;
        const childrenPercent = ((children / total) * 100).toFixed(2);
        const teenagersPercent = ((teenagers / total) * 100).toFixed(2);
        const youngPercent = ((young / total) * 100).toFixed(2);
        const elderPercent = ((elder / total) * 100).toFixed(2);

        // Display the table
        const html = `
            <h4>Covid Trend Table</h4>
            <table border="1">
                <tr>
                    <th>Median Age</th>
                    <td>${median}</td>
                </tr>
                <tr>
                    <th>Children (%)</th>
                    <td>${childrenPercent}%</td>
                </tr>
                <tr>
                    <th>Teenagers (%)</th>
                    <td>${teenagersPercent}%</td>
                </tr>
                <tr>
                    <th>Young (%)</th>
                    <td>${youngPercent}%</td>
                </tr>
                <tr>
                    <th>Elder (%)</th>
                    <td>${elderPercent}%</td>
                </tr>
            </table>
        `;
        $('#covidTrendTable').html(html);
    },
};

$(function () {
    $(window).load(function () {
        App.initWeb();
    });

    $('#patientForm').submit(function (e) {
        e.preventDefault();
        App.registerPatient();
    });

    $('#loadPatients').click(function () {
        App.loadPatients();
    });

    $('#doctorForm').submit(function (e) {
        e.preventDefault();
        App.registerDoctor();
    });

    $('#loadDoctors').click(function () {
        App.loadDoctors();
    });

    $('#appointmentForm').submit(function (e) {
        e.preventDefault();
        App.bookAppointment();
    });

    $('#loadAppointments').click(function () {
        App.loadAppointments();
    });
    
    $('#loadAllAppointments').click(function () {
    App.loadAllAppointments();
    });
        $(window).load(function () {
        App.initWeb();
    });

    // Assign Admin Button
    $("#assignAdmin").click(function () {
        App.assignAdmin();
    });

    // Update Patient Form
    $("#updatePatientForm").submit(function (e) {
        e.preventDefault();
        App.updatePatient();
    });
       $("#renderAdmin").submit(function (e) {
        e.preventDefault();
        App.renderAdmin();

    });
    $("#verifyAdmin").click(function () {
    App.verifyAdmin();
});

    // Make Admin Button
$("#makeAdmin").click(function () {
    App.assignAdmin();
});


});

