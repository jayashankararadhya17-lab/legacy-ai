#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "employee.h"

int init_storage(const char *filepath) {
    FILE *fp = fopen(filepath, "ab");
    if (!fp) {
        perror("Failed to initialize employee data file");
        return -1;
    }
    fclose(fp);
    return 0;
}

int find_employee_by_id(const char *filepath, int id, Employee *out_emp) {
    FILE *fp = fopen(filepath, "rb");
    if (!fp) {
        return 0;
    }

    Employee rec;
    while (fread(&rec, sizeof(Employee), 1, fp) == 1) {
        if (rec.active && rec.id == id) {
            if (out_emp) {
                *out_emp = rec;
            }
            fclose(fp);
            return 1;
        }
    }

    fclose(fp);
    return 0;
}

int create_employee(const char *filepath, Employee emp) {
    if (emp.id <= 0 || emp.salary < 0.0) {
        return -2;
    }
    if (find_employee_by_id(filepath, emp.id, NULL)) {
        return -3; /* Duplicate active ID */
    }

    emp.active = 1;
    FILE *fp = fopen(filepath, "ab");
    if (!fp) {
        perror("Failed to open data file for appending");
        return -1;
    }

    size_t written = fwrite(&emp, sizeof(Employee), 1, fp);
    fclose(fp);

    return (written == 1) ? 0 : -1;
}

int list_employees(const char *filepath) {
    FILE *fp = fopen(filepath, "rb");
    if (!fp) {
        printf("No employee records found.\n");
        return 0;
    }

    Employee rec;
    int count = 0;
    printf("\n%-6s | %-24s | %-18s | %12s\n", "ID", "Name", "Department", "Salary");
    printf("-------+--------------------------+--------------------+-------------\n");

    while (fread(&rec, sizeof(Employee), 1, fp) == 1) {
        if (rec.active) {
            printf("%-6d | %-24s | %-18s | %12.2f\n",
                   rec.id, rec.name, rec.department, rec.salary);
            count++;
        }
    }

    if (count == 0) {
        printf("(No active employees)\n");
    }

    fclose(fp);
    return count;
}

int update_employee(const char *filepath, int id, const char *new_name, const char *new_dept, double new_salary) {
    FILE *fp = fopen(filepath, "r+b");
    if (!fp) {
        return -1;
    }

    Employee rec;
    while (fread(&rec, sizeof(Employee), 1, fp) == 1) {
        if (rec.active && rec.id == id) {
            if (new_name && strlen(new_name) > 0) {
                strncpy(rec.name, new_name, MAX_NAME_LEN - 1);
                rec.name[MAX_NAME_LEN - 1] = '\0';
            }
            if (new_dept && strlen(new_dept) > 0) {
                strncpy(rec.department, new_dept, MAX_DEPT_LEN - 1);
                rec.department[MAX_DEPT_LEN - 1] = '\0';
            }
            if (new_salary >= 0.0) {
                rec.salary = new_salary;
            }

            if (fseek(fp, -(long)sizeof(Employee), SEEK_CUR) != 0) {
                fclose(fp);
                return -1;
            }

            size_t written = fwrite(&rec, sizeof(Employee), 1, fp);
            fclose(fp);
            return (written == 1) ? 0 : -1;
        }
    }

    fclose(fp);
    return 1; /* Not found */
}

int delete_employee(const char *filepath, int id) {
    FILE *fp = fopen(filepath, "r+b");
    if (!fp) {
        return -1;
    }

    Employee rec;
    while (fread(&rec, sizeof(Employee), 1, fp) == 1) {
        if (rec.active && rec.id == id) {
            rec.active = 0;
            if (fseek(fp, -(long)sizeof(Employee), SEEK_CUR) != 0) {
                fclose(fp);
                return -1;
            }

            size_t written = fwrite(&rec, sizeof(Employee), 1, fp);
            fclose(fp);
            return (written == 1) ? 0 : -1;
        }
    }

    fclose(fp);
    return 1; /* Not found */
}