// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

export interface Auth {
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    auth: Auth;
}

const isStringProvided = validationFunctions.isStringProvided;
const generateHash = credentialingFunctions.generateHash;

const signinRouter: Router = express.Router();

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

/**
 * @api {post} /login Request to log in a user
 * @apiName PostLogin
 * @apiGroup Auth
 *
 * @apiDescription This endpoint allows a user to log in by providing valid email and password credentials. 
 * If the credentials are correct, the response will include a JSON Web Token (JWT) for authentication and 
 * a user object containing relevant user details.
 *
 * @apiBody {String} email The user's email address (must be valid and registered).
 * @apiBody {String} password The user's password (must match the password associated with the email).
 *
 * @apiSuccess {String} accessToken JSON Web Token (JWT) for authenticated access.
 * @apiSuccess {Object} user An object containing the logged-in user's details:
 * - `name` {String}: The user's full name (first name + last name).
 * - `email` {String}: The user's email address.
 * - `role` {Number}: The user's role (e.g., 1 for Admin, 2 for User).
 * - `id` {Number}: The unique ID associated with the user.
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information" when either the email or password is not provided in the request.
 * @apiError (400: Invalid Credentials) {String} message "Invalid Credentials" when either:
 * - The supplied email does not exist in the database.
 * - The supplied password does not match the one associated with the email in the database.
 *
 */
signinRouter.post(
    '/login',
    (request: AuthRequest, response: Response, next: NextFunction) => {
        if (
            isStringProvided(request.body.email) &&
            isStringProvided(request.body.password)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: AuthRequest, response: Response) => {
        const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role FROM Account_Credential
                      INNER JOIN Account ON
                      Account_Credential.account_id=Account.account_id 
                      WHERE Account.email=$1`;
        const values = [request.body.email];
        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    console.error('User not found');
                    response.status(400).send({
                        message: 'Invalid Credentials',
                    });
                    return;
                } else if (result.rowCount > 1) {
                    //log the error
                    console.error(
                        'DB Query error on sign in: too many results returned'
                    );
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                    return;
                }

                //Retrieve the salt used to create the salted-hash provided from the DB
                const salt = result.rows[0].salt;

                //Retrieve the salted-hash password provided from the DB
                const storedSaltedHash = result.rows[0].salted_hash;

                //Generate a hash based on the stored salt and the provided password
                const providedSaltedHash = generateHash(
                    request.body.password,
                    salt
                );

                //Did our salted hash match their salted hash?
                if (storedSaltedHash === providedSaltedHash) {
                    //credentials match. get a new JWT
                    const accessToken = jwt.sign(
                        {
                            name: result.rows[0].firstname,
                            role: result.rows[0].account_role,
                            id: result.rows[0].account_id,
                        },
                        key.secret,
                        {
                            expiresIn: '14 days', // expires in 14 days
                        }
                    );
                   
                    response.json({
                        accessToken,
                        user: {
                            id: result.rows[0].account_id,
                            email: result.rows[0].email,
                            name: `${result.rows[0].firstname} ${result.rows[0].lastname}`,
                            role: 'Admin',
                        },
                    });
                } else {
                    console.error('Credentials did not match');
                    //credentials dod not match
                    response.status(400).send({
                        message: 'Invalid Credentials',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on sign in');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { signinRouter };
