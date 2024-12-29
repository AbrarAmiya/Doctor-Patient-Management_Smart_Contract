const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

// Set the contract ABI and address
const contractABI = [/* Your contract ABI goes here */];
const contractAddress = "YOUR_CONTRACT_ADDRESS";  // Replace with your deployed contract address

// Initialize contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

let currentAccount;

// Ensure user is connected to MetaMask or another Ethereum wallet
async function connectWallet() {
    const accounts = await web3.eth.requestAccounts();
    currentAccount = accounts[0];
    console.log("Connected account:", currentAccount);
}

// Register a patient
async function registerPatient() {
    const age = document.getElementById('patientAge').value;
    const gender = document.getElementById('patientGender').value;
    const district = document.getElementById('patientDistrict').value;
    const symptoms = document.getElementById('symptomsDetails').value;

    try {
        await contract.methods.registerPatient(age, gender, district, symptoms)
            .send({ from: currentAccount });
        alert("Patient registered successfully!");
    } catch (error) {
        console.error("Error registering patient:", error);
    }
}

// Register a doctor
async function registerDoctor() {
    const name = document.getElementById('doctorName').value;
    const specialization = document.getElementById('doctorSpecialization').value;

    try {
        await contract.methods.registerDoctor(name, specialization)
            .send({ from: currentAccount });
        alert("Doctor registered successfully!");
    } catch (error) {
        console.error("Error registering doctor:", error);
    }
}

// Search patient or doctor by address
async function searchPatientDoctor() {
    const address = document.getElementById('searchAddress').value;
    try {
        const patient = await contract.methods.patients(address).call();
        const doctor = await contract.methods.doctors(address).call();
        let result = "Not Found";

        if (patient.id !== "0") {
            result = `Patient Found: ${JSON.stringify(patient)}`;
        } else if (doctor.id !== "0") {
            result = `Doctor Found: ${JSON.stringify(doctor)}`;
        }

        document.getElementById('searchResult').innerText = result;
    } catch (error) {
        console.error("Error searching patient/doctor:", error);
    }
}

// Book an appointment
async function bookAppointment() {
    const doctorAddress = document.getElementById('appointmentDoctor').value;
    const timeSlot = document.getElementById('timeSlot').value;

    try {
        const appointmentFee = await contract.methods.appointmentFee().call();
        await contract.methods.bookAppointment(doctorAddress, timeSlot)
            .send({ from: currentAccount, value: appointmentFee });
        alert("Appointment booked successfully!");
    } catch (error) {
        console.error("Error booking appointment:", error);
    }
}

// Connect wallet when page loads
window.onload = async () => {
    await connectWallet();
};

