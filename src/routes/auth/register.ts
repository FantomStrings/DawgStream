// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

const isStringProvided = validationFunctions.isStringProvided;
//const isNumberProvided = validationFunctions.isNumberProvided;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const registerRouter: Router = express.Router();

export interface IUserRequest extends Request {
    id: number;
}

// Password must be at least 8 characters, contain one uppercase letter, one lowercase letter, and one number
const isValidPassword = (password: string): boolean =>
    isStringProvided(password) &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

// Phone number validation requires at least 10 digits (no special characters)
const isValidPhone = (phone: string): boolean =>
    isStringProvided(phone) && /^\d{10,}$/.test(phone);

// Email validation requires the "@" symbol and a domain name
const isValidEmail = (email: string): boolean =>
    isStringProvided(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidRole = (priority: string): boolean =>
    validationFunctions.isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;

// middleware functions may be defined elsewhere!
const emailMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidEmail(request.body.email)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing email  - please refer to documentation',
        });
    }
};

/**
 * @api {post} /register Request to register a user
 *
 * @apiDescription This endpoint allows a new user to register an account. All input fields must meet specific validation rules. See details below for required parameters and validation rules.
 *
 * @apiName PostRegister
 * @apiGroup Auth
 *
 * @apiBody {String} firstname The user's first name (required).
 * @apiBody {String} lastname The user's last name (required).
 * @apiBody {String} email The user's email address (must include '@' and a domain, and be unique).
 * @apiBody {String} password The user's password (must be at least 8 characters, include one uppercase letter, one lowercase letter, and one number).
 * @apiBody {String} username A unique username for the user (required).
 * @apiBody {String} role A role for the user (value must be between 1 and 5).
 * @apiBody {String} phone The user's phone number (must contain at least 10 digits, no special characters).
 *
 * @apiSuccess (Success 201) {String} accessToken A newly created JSON Web Token (JWT) for the user.
 * @apiSuccess (Success 201) {Object} user An object containing the newly registered user's details:
 * - `name` {String}: The user's full name (first name + last name).
 * - `email` {String}: The user's email address.
 * - `role` {Number}: The user's role.
 * - `id` {Number}: The unique ID of the user.
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information" if any required fields are missing.
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password - please refer to documentation" if the password does not meet validation rules.
 * @apiError (400: Invalid Phone) {String} message "Invalid or missing phone number - please refer to documentation" if the phone number does not meet validation rules.
 * @apiError (400: Invalid Email) {String} message "Invalid or missing email - please refer to documentation" if the email does not meet validation rules.
 * @apiError (400: Invalid Role) {String} message "Invalid or missing role - please refer to documentation" if the role is not between 1 and 5.
 * @apiError (400: Username exists) {String} message "Username exists" if the username is already in use.
 * @apiError (400: Email exists) {String} message "Email exists" if the email is already in use.
 *
 */
registerRouter.post(
    '/register',
    emailMiddlewareCheck,
    (request: Request, response: Response, next: NextFunction) => {
        if (
            isStringProvided(request.body.firstname) &&
            isStringProvided(request.body.lastname) &&
            isStringProvided(request.body.username)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPhone(request.body.phone)) {
            next();
            return;
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing phone number  - please refer to documentation',
            });
            return;
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.body.password)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing password  - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidRole(request.body.role)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing role  - please refer to documentation',
            });
        }
    },

    (request: IUserRequest, response: Response, next: NextFunction) => {
        const theQuery =
            'INSERT INTO Account(firstname, lastname, username, email, phone, account_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING account_id';
        const values = [
            request.body.firstname,
            request.body.lastname,
            request.body.username,
            request.body.email,
            request.body.phone,
            request.body.role,
        ];
        console.dir({ ...request.body, password: '******' });
        pool.query(theQuery, values)
            .then((result) => {
                request.id = result.rows[0].account_id;
                next();
            })
            .catch((error) => {
                //log the error
                if (error.constraint == 'account_username_key') {
                    response.status(400).send({
                        message: 'Username exists',
                    });
                } else if (error.constraint == 'account_email_key') {
                    response.status(400).send({
                        message: 'Email exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on register');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    },
    (request: IUserRequest, response: Response) => {
        const salt = generateSalt(32);
        const saltedHash = generateHash(request.body.password, salt);

        const theQuery =
            'INSERT INTO Account_Credential(account_id, salted_hash, salt) VALUES ($1, $2, $3)';
        const values = [request.id, saltedHash, salt];
        pool.query(theQuery, values)
            .then(() => {
                const accessToken = jwt.sign(
                    {
                        role: request.body.role,
                        id: request.id,
                    },
                    key.secret,
                    {
                        expiresIn: '14 days',
                    }
                );
                const user = {
                    name: `${request.body.firstname} ${request.body.lastname}`,
                    email: request.body.email,
                    role: request.body.role,
                    id: request.id,
                };

                response.status(201).send({
                    accessToken,
                    user,
                });
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on register');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

registerRouter.get('/hash_demo', (request, response) => {
    const password = 'password12345';

    const salt = generateSalt(32);
    const saltedHash = generateHash(password, salt);
    const unsaltedHash = generateHash(password, '');

    response.status(200).send({
        salt: salt,
        salted_hash: saltedHash,
        unsalted_hash: unsaltedHash,
    });
});

export { registerRouter };
