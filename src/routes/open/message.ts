//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const messageRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

/*const format = (resultRow) =>
    `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`;*/
const format = (resultRow) =>
    `{${resultRow.ISBN}} - [${resultRow.Title}]  [${resultRow.Author}] [${resultRow.Author}] [${resultRow.Date}]
    [${resultRow.totalRatings}] [${resultRow.oneStar}] [${resultRow.twoStar}] [${resultRow.threeStar}] [${resultRow.fourStar}] 
    [${resultRow.fiveStar}] [${resultRow.averageRating}]`;
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

function mwValidISBNQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const ISBN: string = request.query.ISBN as string;
    if (
        validationFunctions.isNumberProvided(ISBN) /*&&
        parseInt(priority) >= 1 &&
        parseInt(priority) <= 3*/
    ) {
        next();
    } else {
        console.error('Invalid or missing ISBN');
        response.status(400).send({
            message: 'Invalid or missing ISBN - please refer to documentation',
        });
    }
}
function mwValidAuthorQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const Author: string = request.query.Author as string;
    if (
        validationFunctions.isStringProvided(Author) /*&&
        parseInt(priority) >= 1 &&
        parseInt(priority) <= 3*/
    ) {
        next();
    } else {
        console.error('Invalid or missing Author');
        response.status(400).send({
            message: 'Invalid or missing ISBN - please refer to documentation',
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

function mwValidNameLibraryBody(
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
 * @apiBody {number} [oneStar] number of 1 star reviews
 * @apiBody {number} [twoStar] number of 2 star reviews
 * @apiBody {number} [threeStar] number of 3 star reviews
 * @apiBody {number} [fourStar] number of 4 star reviews
 * @apiBody {number} [fiveStar] number of 5 star reviews
 *
 * @apiSuccess (Success 201) {JSON} Book The entered book object
 *
 * @apiError (400: ISBN exists) {String} message "ISBN already exists"
 * @apiError (400: Invalid ISBN) {String} message "Invalid or Missing ISBN - please refer to documentation"
 * @apiError (400: Invalid title) {String} message "Invalid or Missing book title - please refer to documentation"
 * @apiError (400: Invalid author) {String} message "Invalid or Missing book author - please refer to documentation"
 * @apiError (400: Invalid date) {String} message "Invalid or Missing publication date - please refer to documentation"
 * @apiError (400: Invalid Parameters) {String} message "Invalid or Missing required information - please refer to documentation"
 * @apiUse JSONError
 */
messageRouter.post(
    '/',
    mwValidNameMessageBody,
    (request: Request, response: Response, next: NextFunction) => {
        const ISBN: string = request.body.ISBN as string;
        if (
            /*validationFunctions.isNumberProvided(priority) &&
            parseInt(priority) >= 1 &&
            parseInt(priority) <= 3*/
            ISBN.length == 13 &&
            validationFunctions.isNumberProvided(ISBN)
        ) {
            //next();
        } else {
            console.error('Invalid ISBN');
            response.status(400).send({
                message:
                    'Invalid or missing ISBN - please refer to documentation',
            });
        }
        const Title: string = request.body.Title as string;
        if (
            /*validationFunctions.isNumberProvided(priority) &&
            parseInt(priority) >= 1 &&
            parseInt(priority) <= 3*/
            validationFunctions.isStringProvided(Title)
        ) {
            //next();
        } else {
            console.error('Invalid book title');
            response.status(400).send({
                message:
                    'Invalid or missing book title - please refer to documentation',
            });
        }
        const Author: string = request.body.Author as string;
        if (
            /*validationFunctions.isNumberProvided(priority) &&
            parseInt(priority) >= 1 &&
            parseInt(priority) <= 3*/
            validationFunctions.isStringProvided(Author)
        ) {
            //next();
        } else {
            console.error('Invalid book Author');
            response.status(400).send({
                message:
                    'Invalid or missing book Author - please refer to documentation',
            });
        }
        const Date: string = request.body.Date as string;
        if (
            /*validationFunctions.isNumberProvided(priority) &&
            parseInt(priority) >= 1 &&
            parseInt(priority) <= 3*/
            validationFunctions.isNumberProvided(Date)
        ) {
            next();
        } else {
            console.error('Invalid publiciation date');
            response.status(400).send({
                message:
                    'Invalid or missing publication date - please refer to documentation',
            });
        }
        //Figure out these optionals, unsure how we check these.

        next();
    },
    //Method to calculate average rating.
    (request: Request, response: Response, next: NextFunction) => {
        //generate average
        //Figure out these optionals, unsure how we check these.
        //figure out if this as number works lmao
        const totalRatings: number = request.body.totalRatings as number;
        const oneStar: number = request.body.oneStar as number;
        const twoStar: number = request.body.twoStar as number;
        const threeStar: number = request.body.threeStar as number;
        const fourStar: number = request.body.fourStar as number;
        const fiveStar: number = request.body.fiveStar as number;
        if (
            validationFunctions.isNumberProvided(totalRatings) &&
            validationFunctions.isNumberProvided(oneStar) &&
            validationFunctions.isNumberProvided(twoStar) &&
            validationFunctions.isNumberProvided(threeStar) &&
            validationFunctions.isNumberProvided(fourStar) &&
            validationFunctions.isNumberProvided(twoStar)
        ) {
            const averageRating: number =
                (fiveStar * 5 +
                    fourStar * 4 +
                    threeStar * 3 +
                    twoStar * 2 +
                    oneStar) /
                totalRatings;
        } else {
            const averageRating: number = null;
        }
        next();
    },
    (averageRating: number, request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319

        //NOTE: how are we handling the optional reviews?
        const theQuery = //what do we want this to return?
            'INSERT INTO BOOKS(isbn13, authors, publication_year, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_sta, image_url, image_small_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
        const values = [
            request.body.ISBN,
            request.body.Author,
            request.body.Date,
            request.body.Title,
            averageRating,
            request.body.totalRatings,
            request.body.oneStar,
            request.body.twoStar,
            request.body.threeStar,
            request.body.fourStar,
            request.body.fiveStar,
            request.body.imageBigURL,
            request.body.imageSmallURL,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                // result.rows array are the records returned from the SQL statement.
                // An INSERT statement will return a single row, the row that was inserted.
                response.status(201).send({
                    entry: format(result.rows[0]), //might need to change this?
                });
            })
            .catch((error) => {
                //Change how ends with is caught, since we have two uniques.
                if (
                    error.detail != undefined &&
                    //(error.detail as string).endsWith('already exists.')
                    error.detail.includes('already exists') &&
                    error.detail.includes('title')
                ) {
                    console.error('title exists');
                    response.status(400).send({
                        message: 'title exists',
                    });
                }
                if (
                    error.detail != undefined &&
                    //(error.detail as string).endsWith('already exists.')
                    error.detail.includes('already exists') &&
                    error.detail.includes('ISBN')
                ) {
                    console.error('IBSN exists');
                    response.status(400).send({
                        message: 'ISBN exists',
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

/*messageRouter.post(
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
);*/

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
 * @apiParam {number} date the publication year to look up.
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
 * @api {get} /library/retrieve/ISBN/:ISBN Request to retrieve a book by isbn13
 *
 * @apiDescription Request to retrieve a specific book by <code>ISBN</code>. 
 *
 * @apiName GetMessageIsbn
 * @apiGroup Library
 *
 * @apiParam {number} ISBN the isbn13 to look up the specific book.
 * 
 * @apiSuccess {Object} entry the message book object for <code>ISBN</code>
 * @apiSuccess {number} entry.ISBN <code>ISBN</code>
 * @apiSuccess {string} entry.author the author of the book associated <code>ISBN</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>ISBN</code>
 * @apiSuccess {string} entry.title the book title associated with <code>ISBN</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>ISBN</code>

 *
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this isbn was found"
 *
 */

/**
 * @api {get} /library/retrieve/title/:title Request to retrieve a book by title
 *
 * @apiDescription Request to retrieve a specific book by <code>title</code>. 
 *
 * @apiName RetrieveBookTitle
 * @apiGroup Library
 *
 * @apiParam {string} title the title to look up the specific book.
 * 
 * @apiSuccess {Object} entry the message book object for <code>title</code>
 * @apiSuccess {number} entry.ISBN the ISBN of the book associated with <code>title</code>
 * @apiSuccess {string} entry.author the author of the book associated with <code>title</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>title</code>
 * @apiSuccess {string} entry.title the book title associated with <code>title</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>title</code>

 *
 * @apiError (400: Invalid title) {String} message "Invalid or missing title  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this title was found"
 *
 */

/**
 * @api {get} /library/retrieve/rating/:rating Request to retrieve books by rating
 *
 * @apiDescription Request to retrieve the information about all books with the given rating
 *
 * @apiName RetrieveByRating
 * @apiGroup Library
 *
 * @apiParam {number} rating the rating to look up.
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
 * @apiDescription Updates the count of star ratings or a book by title
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
 *
 * @apiSuccess {String[]} entries The list of deleted entries, formatted as:
 *      "ISBN: <code>isbn</code>, Title: <code>title</code>"
 *
 * @apiError (400: Invalid or missing ISBN) {String} message "Invalid or missing ISBN - please refer to documentation"
 * @apiError (404: No ISBN found) {String} message "No matching <code>isbn</code> entries found"
 */
messageRouter.delete(
    '/',
    mwValidISBNQuery,
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM BOOKS WHERE ISBN = $1 RETURNING *'; //Remember to change table name!
        const values = [request.query.ISBN];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows.map(format),
                    });
                } else {
                    response.status(404).send({
                        message: `No book for ISBN ${request.query.ISBN} found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by ISBN');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

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
messageRouter.delete(
    '/',
    mwValidISBNQuery,
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM BOOKS WHERE authors = $1 RETURNING *';
        const values = [request.query.Author];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows.map(format),
                    });
                } else {
                    response.status(404).send({
                        message: `No books for Author ${request.query.Author} found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by ISBN');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

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
    let values = [request.params.name];

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
