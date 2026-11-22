#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "employee.h"

static void clear_stdin(void) {
    int ch;
    while ((ch = getchar()) != '\n' && ch != EOF) {
        /* discard remaining input */
    }
}

static void read_line(const char *prompt, char *buf, size_t size) {
    printf("%s", prompt);
    if (fgets(buf, (int)size, stdin) != NULL) {
        size_t len = strlen(buf);
        if (len > 0 && buf[len - 1] == '\n') {
            buf[len - 1] = '\0';
        }
    } else {
        buf[0] = '\0';
    }
}

int main(void) {
    int choice = 0;

    if (init_storage(DATA_FILE) != 0) {
        return 1;
    }

    while (1) {
        printf("\n=== Legacy Employee CRUD System ===\n");
        printf("1. Create Employee\n");
        printf("2. List All Employees\n");
        printf("3. Find Employee by ID\n");
        printf("4. Update Employee\n");
        printf("5. Delete Employee\n");
        printf("6. Exit\n");
        printf("Enter choice: ");

        if (scanf("%d", &choice) != 1) {
            clear_stdin();
            printf("Invalid input. Enter a number from 1 to 6.\n");
            continue;
        }
        clear_stdin();

        if (choice == 1) {
            Employee emp;
            printf("Enter Employee ID: ");
            if (scanf("%d", &emp.id) != 1) {
                clear_stdin();
                printf("Invalid ID.\n");
                continue;
            }
            clear_stdin();

            read_line("Enter Name: ", emp.name, MAX_NAME_LEN);
            read_line("Enter Department: ", emp.department, MAX_DEPT_LEN);

            printf("Enter Salary: ");
            if (scanf("%lf", &emp.salary) != 1) {
                clear_stdin();
                printf("Invalid salary.\n");
                continue;
            }
            clear_stdin();

            int status = create_employee(DATA_FILE, emp);
            if (status == 0) {
                printf("Employee created successfully.\n");
            } else if (status == -3) {
                printf("Error: Employee ID %d already exists.\n", emp.id);
            } else {
                printf("Error creating employee (code %d).\n", status);
            }
        } else if (choice == 2) {
            list_employees(DATA_FILE);
        } else if (choice == 3) {
            int id = 0;
            Employee found;
            printf("Enter Employee ID to search: ");
            if (scanf("%d", &id) != 1) {
                clear_stdin();
                printf("Invalid ID.\n");
                continue;
            }
            clear_stdin();

            if (find_employee_by_id(DATA_FILE, id, &found)) {
                printf("Found -> ID: %d | Name: %s | Dept: %s | Salary: %.2f\n",
                       found.id, found.name, found.department, found.salary);
            } else {
                printf("Employee ID %d not found.\n", id);
            }
        } else if (choice == 4) {
            int id = 0;
            char name[MAX_NAME_LEN];
            char dept[MAX_DEPT_LEN];
            double salary = 0.0;

            printf("Enter Employee ID to update: ");
            if (scanf("%d", &id) != 1) {
                clear_stdin();
                printf("Invalid ID.\n");
                continue;
            }
            clear_stdin();

            read_line("New Name (leave blank to keep): ", name, MAX_NAME_LEN);
            read_line("New Department (leave blank to keep): ", dept, MAX_DEPT_LEN);

            printf("New Salary (-1 to keep): ");
            if (scanf("%lf", &salary) != 1) {
                clear_stdin();
                printf("Invalid salary.\n");
                continue;
            }
            clear_stdin();

            int status = update_employee(DATA_FILE, id, name, dept, salary);
            if (status == 0) {
                printf("Employee updated.\n");
            } else if (status == 1) {
                printf("Employee ID %d not found.\n", id);
            } else {
                printf("Failed to update employee.\n");
            }
        } else if (choice == 5) {
            int id = 0;
            printf("Enter Employee ID to delete: ");
            if (scanf("%d", &id) != 1) {
                clear_stdin();
                printf("Invalid ID.\n");
                continue;
            }
            clear_stdin();

            int status = delete_employee(DATA_FILE, id);
            if (status == 0) {
                printf("Employee deleted.\n");
            } else if (status == 1) {
                printf("Employee ID %d not found.\n", id);
            } else {
                printf("Failed to delete employee.\n");
            }
        } else if (choice == 6) {
            printf("Exiting.\n");
            break;
        } else {
            printf("Invalid choice.\n");
        }
    }

    return 0;
}