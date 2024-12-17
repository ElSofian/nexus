module.exports = class Database {
    constructor(client, db) {
        this.client = client;
        this.db = db;
    }

    // Database

    async init() {
        const employees = await this.db.get("employees");
        if (!employees) {
            await this.db.set("employees", []);
        }
    }

    async reset() {
        await this.db.delete("employees");
        await this.init();
    }

    // Employees

    async getEmployees() {
        return this.db.get("employees");
    }

    async getEmployee(userId) {
        const employees = await this.db.get("employees") || [];
        return employees.find(e => e.user_id === userId) || null;
    }

    async getEmployeeName(userId, returnType = "string") {
        const row = await this.getEmployee(userId);
        if (!row) return null;

        switch (returnType) {
            case "array": return [row.first_name, row.last_name];
            case "object": return { first_name: row.first_name, last_name: row.last_name };
            case "string":
            default: return `${row.first_name} ${row.last_name}`;
        }
    }

    async createEmployee(userId, firstName, lastName, birthDate, grade, speciality, phone, iban) {
       return this.db.push("employees", {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate,
            grade,
            specialities: [speciality],
            phone,
            iban
        });
    }

    async addSpeciality(employeeId, speciality) {
        const employees = await this.getEmployees() || [];
    
        const employeeIndex = employees.findIndex(emp => emp.user_id === employeeId);
        if (employeeIndex === -1) return null;
    
        if (!Array.isArray(employees[employeeIndex].specialities))
            employees[employeeIndex].specialities = [];
    
        if (employees[employeeIndex].specialities.includes(speciality)) return null;
    
        employees[employeeIndex].specialities.push(speciality);
        return this.db.set("employees", employees);
    }
    

    async removeSpeciality(employeeId, speciality) {
        const employee = await this.getEmployee(employeeId);
        if (!employee) return null;
    
        const updatedSpecialities = employee.specialities.filter(s => s !== speciality);
    
        return this.setEmployee(employeeId, "specialities", updatedSpecialities);
    }
    

    async setEmployee(userId, key, value) {
        const employees = await this.getEmployees() || [];

        const employeeIndex = employees.findIndex(emp => emp.user_id === userId);
        if (employeeIndex === -1) return null;

        employees[employeeIndex][key] = value;

        return this.db.set("employees", employees);
    }

    async deleteEmployee(userId) {
        return this.db.pull("employees", (e) => e.user_id === userId);
    }
}
