//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const messageRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

const format = (resultRow) =>
    `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`;

function mwValidPriorityQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const priority: string = request.query.priority as string;
    if (
        validationFunctions.isNumberProvided(priority) &&
        parseInt(priority) >= 1 &&
        parseInt(priority) <= 3
    ) {
        next();
    } else {
        console.error('Invalid or missing Priority');
        response.status(400).send({
            message:
                'Invalid or missing Priority - please refer to documentation',
        });
    }
}

function mwValidNameMessageBody(
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (
        isStringProvided(request.body.name) &&
        isStringProvided(request.body.message)
    ) {
        next();
    } else {
        console.error('Missing required information');
        response.status(400).send({
            message:
                'Missing required information - please refer to documentation',
        });
    }
}

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /message Request to add an entry
 *
 * @apiDescription Request to add a message and someone's name to the DB
 *
 * @apiName PostMessage
 * @apiGroup Message
 *
 * @apiBody {string} name someone's name *unique
 * @apiBody {string} message a message to store with the name
 * @apiBody {number} priority a message priority [1-3]
 *
 *
 * @apiSuccess (Success 201) {String} entry the string:
 *      "{<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (400: Name exists) {String} message "Name exists"
 * @apiError (400: Missing Parameters) {String} message "Missing required information - please refer to documentation"
 * @apiError (400: Invalid Priority) {String} message "Invalid or missing Priority  - please refer to documentation"
 * @apiUse JSONError
 */
messageRouter.post(
    '/',
    mwValidNameMessageBody,
    (request: Request, response: Response, next: NextFunction) => {
        const priority: string = request.body.priority as string;
        if (
            validationFunctions.isNumberProvided(priority) &&
            parseInt(priority) >= 1 &&
            parseInt(priority) <= 3
        ) {
            next();
        } else {
            console.error('Invalid or missing Priority');
            response.status(400).send({
                message:
                    'Invalid or missing Priority - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        const theQuery =
            'INSERT INTO DEMO(Name, Message, Priority) VALUES ($1, $2, $3) RETURNING *';
        const values = [
            request.body.name,
            request.body.message,
            request.body.priority,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                // result.rows array are the records returned from the SQL statement.
                // An INSERT statement will return a single row, the row that was inserted.
                response.status(201).send({
                    entry: format(result.rows[0]),
                });
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    console.error('Name exists');
                    response.status(400).send({
                        message: 'Name exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    }
);

/**
 * @api {post} /library/add Request to add an entry
 *
 * @apiDescription Request to add a book to the DB
 *
 * @apiName PostMessage
 * @apiGroup Library
 *
 * @apiBody {number} ISBN ISBN *unique
 * @apiBody {string} Title Title of the book *unique
 * @apiBody {string} Author Author of the book
 * @apiBody {number} Date The publication year
 * @apiBody {number} [totalRatings] total number of ratings
 * @apiBody {number} [1Star] number of 1 star reviews
 * @apiBody {number} [2Star] number of 2 star reviews
 * @apiBody {number} [3Star] number of 3 star reviews
 * @apiBody {number} [4Star] number of 4 star reviews
 * @apiBody {number} [5Star] number of 5 star reviews
 *
 * @apiSuccess (Success 201) {JSON} Book The entered book object
 *
 * @apiError (400: ISBN exists) {String} message "ISBN already exists"
 * @apiError (400: Missing ISBN) {String} message "Missing ISBN - please refer to documentation"
 * @apiError (400: Missing title) {String} message "Missing book title - please refer to documentation"
 * @apiError (400: Missing author) {String} message "Missing book author - please refer to documentation"
 * @apiError (400: Missing Parameters) {String} message "Missing required information - please refer to documentation"
 * @apiUse JSONError
 */

/**
 * @api {get} /library/retrieve/Author/:author Request to retrieve books by author's name
 *
 * @apiDescription Request to retrieve the information about all books written by <code>author</code>.
 *
 * @apiName GetMessageAuthor
 * @apiGroup Library
 *
 * @apiParam {string} author the author to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>author</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (404: Book Not Found) {string} message "No book associated with this author was found"
 *
 */

/**
 * @api {get} /library/retrieve/Date/:date Request to retrieve books by original publication date
 *
 * @apiDescription Request to retrieve the information about all books published in <code>date</code>.
 *
 * @apiName GetMessageDate
 * @apiGroup Library
 *
 * @apiQuery {number} date the publication year to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>author</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (404: Book Not Found) {string} message "No book associated with this publication year was found"
 *
 */

/**
 * @api {get} /library/retrieve Request to retrieve all books
 *
 * @apiDescription Request to retrieve the information about all books
 *
 * @apiName RetrieveAllBooks
 * @apiGroup Library
 *
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>author</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (404: Books Not Found) {string} message "No books found"
 *
 */

/**
 * @api {get} /library/retrieve/isbn13/:isbn13 Request to retrieve a book by isbn13
 *
 * @apiDescription Request to retrieve a specific book by <code>isbn13</code>. 
 *
 * @apiName GetMessageIsbn
 * @apiGroup Library
 *
 * @apiParam {number} ISBN the isbn13 to look up the specific book.
 * 
 * @apiSuccess {Object} entry the message book object for <code>isbn13</code>
 * @apiSuccess {number} entry.isbn13 <code>isbn13</code>
 * @apiSuccess {string} entry.authors the author of the book associated <code>isbn13</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>isbn13</code>
 * @apiSuccess {string} entry.title the book title associated with <code>isbn13</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>isbn13</code>

 *
 * @apiError (400: Invalid isbn13) {String} message "Invalid or missing isbn13  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this isbn was found"
 *
 */
messageRouter.get('/:isbn13', (request: Request, response: Response) => {
    const theQuery =
        'SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS WHERE isbn13 = $1';
    const values = [request.params.isbn13];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount == 1) {
                response.send({
                    entry: result.rows[0],
                });
            } else {
                response.status(404).send({
                    message: 'Book not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET /:ISBN');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

function mwValidTitleQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const title: string = request.query.title as string;
    if (
        validationFunctions.isStringProvided(title) &&
        !validationFunctions.isNumberProvided(title)
    ) {
        next();
    } else {
        console.error('Invalid or missing title');
        response.status(400).send({
            message: 'Invalid or missing title - please refer to documentation',
        });
    }
}

/**
 * @api {get} /library?title=(name here) Request to retrieve a book by title
 *
 * @apiDescription Request to retrieve a specific book by <code>title</code>. 
 *
 * @apiName RetrieveBookTitle
 * @apiGroup Library
 *
 * @apiParam {string} title the title to look up the specific book.
 * 
 * @apiSuccess {Object} entry the message book object for <code>title</code>
 * @apiSuccess {number} entry.isbn13 the ISBN of the book associated with <code>title</code>
 * @apiSuccess {string} entry.author the author of the book associated with <code>title</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>title</code>
 * @apiSuccess {string} entry.title the book title associated with <code>title</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>title</code>

 *
 * @apiError (400: Invalid title) {String} message "Invalid or missing title  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this title was found"
 *
 */
messageRouter.get(
    '/',
    mwValidTitleQuery,
    (request: Request, response: Response) => {
        const theQuery =
            'SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS where title = $1';
        const values = [request.query.title];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows[0],
                    });
                } else {
                    response.status(404).send({
                        message: `No title ${request.query.title} messages found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET by title');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {get} /library/retrieve/rating/:rating Request to retrieve books by rating
 *
 * @apiDescription Request to retrieve the information about all books with the given <code>rating</code>
 *
 * @apiName RetrieveByRating
 * @apiGroup Library
 *
 * @apiQuery {number} rating the rating to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>author</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (404: Book Not Found) {string} message "No book associated with this rating was found"
 *
 */

/**
 * @api {put} /library/update/ratings Request to update book rating
 *
 * @apiDescription Updates the count of star ratings or a book by <code>title</code>
 *
 * @apiName UpdateRating
 * @apiGroup Library
 *
 * @apiBody {String} title The title of the book to update.
 * @apiBody {Number{0+}} [rating_1_star] The new count for 1-star ratings.
 * @apiBody {Number{0+}} [rating_2_star] The new count for 2-star ratings.
 * @apiBody {Number{0+}} [rating_3_star] The new count for 3-star ratings.
 * @apiBody {Number{0+}} [rating_4_star] The new count for 4-star ratings.
 * @apiBody {Number{0+}} [rating_5_star] The new count for 5-star ratings.
 *
 * @apiSuccess {String} message Confirmation that the book's ratings have been updated.
 *
 *
 * @apiError (404: Book Not Found) {String} message "Book title not found"
 * @apiError (400: Missing Parameters) {String} message "At least one rating count must be provided"
 * @apiError (400: Invalid Rating Count) {String} message "Rating counts must be non-negative integers"
 * @apiUse JSONError
 */

/**
 * @api {delete} /library/remove/ISBN/:ISBN Request to remove book entries by ISBN
 *
 * @apiDescription Request to remove all entries of <code>isbn</code>
 *
 * @apiName DeleteISBN
 * @apiGroup Library
 *
 * @apiParam {number} ISBN The ISBN of the book to remove
 *
 *
 * @apiSuccess {String[]} entries The list of deleted entries, formatted as:
 *      "ISBN: <code>isbn</code>, Title: <code>title</code>"
 *
 * @apiError (400: Invalid or missing ISBN) {String} message "Invalid or missing ISBN - please refer to documentation"
 * @apiError (404: No ISBN found) {String} message "No matching <code>isbn</code> entries found"
 */

/**
 * @api {delete} /library/remove/author/:author Request to remove a series by author
 *
 * @apiDescription Request to remove an entry associated with <code>author</code> in the DB
 *
 * @apiName DeleteAuthor
 * @apiGroup Library
 *
 * @apiParam {String} author The author associated with the entries to delete
 *
 * @apiSuccess {String} entries A string of the deleted book entry, formatted as:
 *     "Deleted: ISBN: <code>isbn</code>, Title: <code>title</code>"
 *
 * @apiError (404: Author Not Found) {String} message "Author not found"
 */

/**
 * @api {get} /message/all Request to all retrieve entries
 *
 * @apiDescription Request to retrieve all the entries
 *
 * @apiName GetAllMessages
 * @apiGroup Message
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 */
messageRouter.get('/all', (request: Request, response: Response) => {
    const theQuery = 'SELECT name, message, priority FROM Demo';

    pool.query(theQuery)
        .then((result) => {
            response.send({
                entries: result.rows.map(format),
            });
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET all');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {get} /message Request to retrieve entries by priority
 *
 * @apiDescription Request to retrieve all the entries of <code>priority</code>
 *
 * @apiName GetAllMessagesPri
 * @apiGroup Message
 *
 * @apiQuery {number} priority the priority in which to retrieve all entries
 *
 * @apiSuccess {String[]} entries the aggregate of all entries with <code>priority</code> as the following string:
 *      "{<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (400: Invalid Priority) {String} message "Invalid or missing Priority  - please refer to documentation"
 * @apiError (404: No messages) {String} message "No Priority <code>priority</code> messages found"
 */
messageRouter.get(
    '/',
    mwValidPriorityQuery,
    (request: Request, response: Response) => {
        const theQuery =
            'SELECT name, message, priority FROM Demo where priority = $1';
        const values = [request.query.priority];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: `No Priority ${request.query.priority} messages found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET by priority');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {get} /message/:name Request to retrieve an entry by name
 *
 * @apiDescription Request to retrieve the complete entry for <code>name</code>.
 * Note this endpoint returns an entry as an object, not a formatted string like the
 * other endpoints.
 *
 * @apiName GetMessageName
 * @apiGroup Message
 *
 * @apiParam {string} name the name to look up.
 *
 * @apiSuccess {Object} entry the message entry object for <code>name</code>
 * @apiSuccess {string} entry.name <code>name</code>
 * @apiSuccess {string} entry.message The message associated with <code>name</code>
 * @apiSuccess {number} entry.priority The priority associated with <code>name</code>
 *
 * @apiError (404: Name Not Found) {string} message "Name not found"
 */
messageRouter.get('/:name', (request: Request, response: Response) => {
    const theQuery = 'SELECT name, message, priority FROM Demo WHERE name = $1';
    const values = [request.params.name];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount == 1) {
                response.send({
                    entry: result.rows[0],
                });
            } else {
                response.status(404).send({
                    message: 'Name not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET /:name');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {put} /message Request to change an entry
 *
 * @apiDescription Request to replace the message entry in the DB for name
 *
 * @apiName PutMessage
 * @apiGroup Message
 *
 * @apiBody {String} name the name entry
 * @apiBody {String} message a message to replace with the associated name
 *
 * @apiSuccess {String} entry the string
 *      "Updated: {<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (404: Name Not Found) {String} message "Name not found"
 * @apiError (400: Missing Parameters) {String} message "Missing required information" *
 * @apiUse JSONError
 */
messageRouter.put(
    '/',
    mwValidNameMessageBody,
    (request: Request, response: Response, next: NextFunction) => {
        const theQuery =
            'UPDATE Demo SET message = $1 WHERE name = $2 RETURNING *';
        const values = [request.body.message, request.body.name];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 1) {
                    response.send({
                        entry: 'Updated: ' + format(result.rows[0]),
                    });
                } else {
                    response.status(404).send({
                        message: 'Name not found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on PUT');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {delete} /message Request to remove entries by priority
 *
 * @apiDescription Request to remove all entries of <code>priority</code>
 *
 * @apiName DeleteMessagesPri
 * @apiGroup Message
 *
 * @apiQuery {number} priority the priority [1-3] to delete all entries
 *
 * @apiSuccess {String[]} entries the aggregate of all deleted entries with <code>priority</code> as the following string:
 *      "{<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (400: Invalid or missing Priority) {String} message "Invalid or missing Priority - please refer to documentation"
 * @apiError (404: No messages) {String} message "No Priority <code>priority</code> messages found"
 */
messageRouter.delete(
    '/',
    mwValidPriorityQuery,
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Demo  WHERE priority = $1 RETURNING *';
        const values = [request.query.priority];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows.map(format),
                    });
                } else {
                    response.status(404).send({
                        message: `No Priority ${request.query.priority} messages found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by priority');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {delete} /message/:name Request to remove an entry by name
 *
 * @apiDescription Request to remove an entry associated with <code>name</code> in the DB
 *
 * @apiName DeleteMessage
 * @apiGroup Message
 *
 * @apiParam {String} name the name associated with the entry to delete
 *
 * @apiSuccess {String} entry the string
 *      "Deleted: {<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (404: Name Not Found) {String} message "Name not found"
 */
messageRouter.delete('/:name', (request: Request, response: Response) => {
    const theQuery = 'DELETE FROM Demo  WHERE name = $1 RETURNING *';
    const values = [request.params.name];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount == 1) {
                response.send({
                    entry: 'Deleted: ' + format(result.rows[0]),
                });
            } else {
                response.status(404).send({
                    message: 'Name not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on DELETE /:name');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

// "return" the router
export { messageRouter };
