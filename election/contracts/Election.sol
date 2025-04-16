// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Election {
    enum VaccineStatus { NOT_VACCINATED, ONE_DOSE, TWO_DOSE }

    struct Patient {
        uint id;
        uint age;
        string gender;
        VaccineStatus vaccine_status;
        string district;
        string symptoms_details;
        bool is_dead;
        address patientAddress;
    }

    struct Doctor {
        uint id;
        string name;
        string specialization;
        address doctorAddress;
    }

    struct Appointment {
        address patient;
        string timeSlot;
        address doctor;
    }

    address public admin;
    uint public patientCounter = 0;
    uint public doctorCounter = 0;

    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;

    address[] public patientAddresses; // Array for patient addresses
    address[] public doctorAddresses;  // Array for doctor addresses

    Appointment[] public appointments;

    string[] public timeSlots = [
        "Slot 1: 4:00 PM - 4:10 PM",
        "Slot 2: 4:11 PM - 4:20 PM",
        "Slot 3: 4:21 PM - 4:30 PM",
        "Slot 4: 4:31 PM - 4:40 PM"
    ];

    mapping(address => mapping(string => bool)) public doctorBookings;
    uint public appointmentFee = 0.01 ether;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredPatient() {
        require(patients[msg.sender].id != 0, "Only registered patients can perform this action");
        _;
    }

    modifier onlyRegisteredDoctor() {
        require(doctors[msg.sender].id != 0, "Only registered doctors can perform this action");
        _;
    }

    constructor() {
        admin = 0xF7Cd5E272fC093357c961fE68a922A75D40712e1;
    }

    function registerPatient(
        uint _age,
        string memory _gender,
        string memory _district,
        string memory _symptoms_details
    ) public {
        require(patients[msg.sender].id == 0, "Patient already registered");

        patients[msg.sender] = Patient({
            id: ++patientCounter,
            age: _age,
            gender: _gender,
            vaccine_status: VaccineStatus.NOT_VACCINATED,
            district: _district,
            symptoms_details: _symptoms_details,
            is_dead: false,
            patientAddress: msg.sender
        });

        patientAddresses.push(msg.sender); // Store patient address
    }
    function updatePatientData(
    address _patientAddress,
    VaccineStatus _vaccine_status,
    bool _is_dead
) public onlyAdmin {
    Patient storage patient = patients[_patientAddress];
    require(patient.id != 0, "Patient not found");

    patient.vaccine_status = _vaccine_status;
    patient.is_dead = _is_dead;
}


    function registerDoctor(
        string memory _name,
        string memory _specialization
    ) public {
        require(doctors[msg.sender].id == 0, "Doctor already registered");

        doctors[msg.sender] = Doctor({
            id: ++doctorCounter,
            name: _name,
            specialization: _specialization,
            doctorAddress: msg.sender
        });

        doctorAddresses.push(msg.sender); // Store doctor address
    }

    function getAllPatients() public view returns (address[] memory) {
        return patientAddresses;
    }

    function getAllDoctors() public view returns (address[] memory) {
        return doctorAddresses;
    }

    // Add bookAppointment function
    function bookAppointment(address doctor, string memory timeSlot) public payable onlyRegisteredPatient {
        require(doctors[doctor].id != 0, "Doctor not found");
        require(msg.value >= appointmentFee, "Insufficient appointment fee");
        require(!doctorBookings[doctor][timeSlot], "Time slot already booked");

        doctorBookings[doctor][timeSlot] = true;

        appointments.push(Appointment({
            patient: msg.sender,
            timeSlot: timeSlot,
            doctor: doctor
        }));
    }

    // Retrieve all appointments
    function getAppointments() public view returns (Appointment[] memory) {
        return appointments;
    }
function getAllAppointments() public view returns (
    address[] memory _patients,
    string[] memory _timeSlots,
    address[] memory _doctors
) {
    uint totalAppointments = appointments.length;

    // Initialize arrays for return
    _patients = new address[](totalAppointments);
    _timeSlots = new string[](totalAppointments);
    _doctors = new address[](totalAppointments);

    // Populate arrays with appointment data
    for (uint i = 0; i < totalAppointments; i++) {
        Appointment storage appointment = appointments[i];
        _patients[i] = appointment.patient;
        _timeSlots[i] = appointment.timeSlot;
        _doctors[i] = appointment.doctor;
    }

    return (_patients, _timeSlots, _doctors);
}

}

