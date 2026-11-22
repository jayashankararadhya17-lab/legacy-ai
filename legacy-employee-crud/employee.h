#ifndef EMPLOYEE_H
#define EMPLOYEE_H

#define MAX_NAME_LEN 100
#define MAX_DEPT_LEN 60
#define DATA_FILE "employees.dat"

typedef struct {
    int id;
    char name[MAX_NAME_LEN];
    char department[MAX_DEPT_LEN];
    double salary;
    int active; /* 1 = active, 0 = soft-deleted */
} Employee;

/* Storage / CRUD prototypes */
int init_storage(const char *filepath);
int create_employee(const char *filepath, Employee emp);
int list_employees(const char *filepath);
int find_employee_by_id(const char *filepath, int id, Employee *out_emp);
int update_employee(const char *filepath, int id, const char *new_name, const char *new_dept, double new_salary);
int delete_employee(const char *filepath, int id);

#endif