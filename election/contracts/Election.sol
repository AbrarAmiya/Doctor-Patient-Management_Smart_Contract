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
        admin = msg.sender;
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
    }

    function updatePatientData(
        address _patientAddress,
        VaccineStatus _vaccine_status,
        bool _is_dead
    ) public onlyAdmin {
        Patient storage patient = patients[_patientAddress];
        require(patient.id != 0, "Patient not found");
        require(!patient.is_dead, "Cannot update data of a deceased patient");

        patient.vaccine_status = _vaccine_status;
        if (_is_dead) {
            patient.is_dead = true;
        }
    }

    function bookAppointment(address doctor, string memory timeSlot) public payable onlyRegisteredPatient {
        require(doctors[doctor].id != 0, "Doctor not found");
        require(msg.value >= appointmentFee, "Incorrect fee amount");
        require(!doctorBookings[doctor][timeSlot], "Time slot already booked");

        doctorBookings[doctor][timeSlot] = true;
        appointments.push(Appointment({
            patient: msg.sender,
            timeSlot: timeSlot,
            doctor: doctor
        }));

        if (msg.value > appointmentFee) {
            payable(msg.sender).transfer(msg.value - appointmentFee);
        }
    }

    function withdrawFees() public onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }

    function getAppointments() public view returns (Appointment[] memory) {
        return appointments;
    }

    function getDoctorSchedule(address doctor) public view returns (Appointment[] memory) {
        uint count = 0;
        for (uint i = 0; i < appointments.length; i++) {
            if (appointments[i].doctor == doctor) {
                count++;
            }
        }

        Appointment[] memory schedule = new Appointment[](count);
        uint index = 0;
        for (uint i = 0; i < appointments.length; i++) {
            if (appointments[i].doctor == doctor) {
                schedule[index] = appointments[i];
                index++;
            }
        }
        return schedule;
    }

    function seeAllAppointments() public view returns (Appointment[] memory) {
        return appointments;
    }
}
