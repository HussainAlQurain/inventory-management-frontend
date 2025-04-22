export interface User {
    id?: number;
    username: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status?: string;
    roles?: string[];
    companyIds?: number[];
}

// DTO for creating a new user
export interface UserCreateDTO {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
}

// DTO for updating an existing user
export interface UserUpdateDTO {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
}

// Available user roles in the system
export enum UserRole {
    USER = 'ROLE_USER',
    STAFF = 'ROLE_STAFF',
    MANAGER = 'ROLE_MANAGER',
    ADMIN = 'ROLE_ADMIN',
    SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
    SYSTEM_ADMIN = 'ROLE_SYSTEM_ADMIN'
}
