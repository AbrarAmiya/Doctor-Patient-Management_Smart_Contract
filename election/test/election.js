let Election = artifacts.require("./Election.sol");

contract("Election", async function(accounts) {
    console.log('Your Available Ganache Accounts: ' + accounts);

    let electionInstance;
    beforeEach(async function() {
        electionInstance = await Election.new();
    });

    it("should initialize with no doctors and patients", async function() {
        const patientCount = await electionInstance.patientCounter();
        const doctorCount = await electionInstance.doctorCounter();

        // Check that initially, there are no patients or doctors
        assert.equal(patientCount, 0, "Initial patient count should be 0");
        assert.equal(doctorCount, 0, "Initial doctor count should be 0");
    });

    it("should allow a patient to register", async function() {
        const patientAge = 25;
        const patientGender = "Female";
        const patientDistrict = "New York";
        const patientSymptoms = "Fever";

        await electionInstance.registerPatient(patientAge, patientGender, patientDistrict, patientSymptoms, { from: accounts[0] });

        const patient = await electionInstance.patients(accounts[0]);

        assert.equal(patient.id, 1, "Patient ID should be 1");
        assert.equal(patient.age, patientAge, "Patient age should be correct");
        assert.equal(patient.gender, patientGender, "Patient gender should be correct");
        assert.equal(patient.district, patientDistrict, "Patient district should be correct");
        assert.equal(patient.symptoms_details, patientSymptoms, "Patient symptoms should be correct");
        assert.equal(patient.is_dead, false, "Patient should not be dead initially");
    });

    it("should not allow a patient to register twice", async function() {
        const patientAge = 30;
        const patientGender = "Male";
        const patientDistrict = "California";
        const patientSymptoms = "Cough";

        await electionInstance.registerPatient(patientAge, patientGender, patientDistrict, patientSymptoms, { from: accounts[1] });

        try {
            await electionInstance.registerPatient(patientAge, patientGender, patientDistrict, patientSymptoms, { from: accounts[1] });
            assert.fail("The patient should not be able to register twice.");
        } catch (error) {
            assert(error.message.includes("Patient already registered"), "Error should be Patient already registered");
        }
    });

    it("should allow a doctor to register", async function() {
        const doctorName = "Dr. John Doe";
        const doctorSpecialization = "Cardiologist";

        await electionInstance.registerDoctor(doctorName, doctorSpecialization, { from: accounts[2] });

        const doctor = await electionInstance.doctors(accounts[2]);

        assert.equal(doctor.id, 1, "Doctor ID should be 1");
        assert.equal(doctor.name, doctorName, "Doctor name should be correct");
        assert.equal(doctor.specialization, doctorSpecialization, "Doctor specialization should be correct");
    });

    it("should allow a patient to book an appointment", async function() {
        // Register patient and doctor first
        await electionInstance.registerPatient(30, "Male", "California", "No symptoms", { from: accounts[3] });
        await electionInstance.registerDoctor("Dr. Smith", "Dentist", { from: accounts[4] });

        const timeSlot = "Slot 1: 4:00 PM - 4:10 PM";

        // Book appointment
        const initialBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));
        const appointmentFee = web3.utils.toBN(await electionInstance.appointmentFee());

        await electionInstance.bookAppointment(accounts[4], timeSlot, { from: accounts[3], value: appointmentFee });

        const patientAppointments = await electionInstance.getAppointments();
        assert.equal(patientAppointments.length, 1, "Patient should have one appointment");

        const patientAppointment = patientAppointments[0];
        assert.equal(patientAppointment.patient, accounts[3], "Patient address should match");
        assert.equal(patientAppointment.doctor, accounts[4], "Doctor address should match");
        assert.equal(patientAppointment.timeSlot, timeSlot, "Time slot should match");

        const finalBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[3]));
        assert(finalBalance.add(appointmentFee).eq(initialBalance), "Patient's balance should have been debited by appointment fee");
    });

    it("should not allow double booking of a time slot", async function() {
        // Register patient and doctor first
        await electionInstance.registerPatient(28, "Female", "Florida", "Headache", { from: accounts[5] });
        await electionInstance.registerDoctor("Dr. Lee", "Pediatrician", { from: accounts[6] });

        const timeSlot = "Slot 2: 4:11 PM - 4:20 PM";

        // First appointment
        await electionInstance.bookAppointment(accounts[6], timeSlot, { from: accounts[5], value: web3.utils.toWei("0.01", "ether") });

        try {
            // Second appointment with the same slot
            await electionInstance.bookAppointment(accounts[6], timeSlot, { from: accounts[5], value: web3.utils.toWei("0.01", "ether") });
            assert.fail("The time slot should be already booked.");
        } catch (error) {
            assert(error.message.includes("Time slot already booked"), "Error should be Time slot already booked");
        }
    });

    it("should allow admin to update patient data", async function() {
        // Register a patient
        await electionInstance.registerPatient(40, "Male", "Texas", "No symptoms", { from: accounts[7] });

        // Update patient data
        const vaccineStatus = 1; // ONE_DOSE
        const isDead = true;

        await electionInstance.updatePatientData(accounts[7], vaccineStatus, isDead, { from: accounts[0] });

        const patient = await electionInstance.patients(accounts[7]);
        assert.equal(patient.vaccine_status, vaccineStatus, "Patient's vaccine status should be updated");
        assert.equal(patient.is_dead, true, "Patient's dead status should be updated");
    });

    it("should not allow non-admin to update patient data", async function() {
        // Register a patient
        await electionInstance.registerPatient(55, "Female", "Ohio", "Cough", { from: accounts[8] });

        try {
            // Non-admin tries to update patient data
            await electionInstance.updatePatientData(accounts[8], 2, false, { from: accounts[8] });
            assert.fail("Only admin can update patient data.");
        } catch (error) {
            assert(error.message.includes("Only admin can perform this action"), "Error should be Only admin can perform this action");
        }
    });
});

