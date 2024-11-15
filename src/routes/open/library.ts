// Section 1: Imports and Initial Setup

//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const libraryRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

const format = (resultRow) =>
    `{'ISBN: ' ${resultRow.isbn13}} - 'Title: '[${resultRow.title}]  ' author '[${resultRow.authors}] ' publication year: [${resultRow.publication_year}] ' rating count: [${resultRow.rating_count}] ' rating average: ' [${resultRow.rating_avg}]`;

// Section 2: Middleware Functions

function myValidAuthorQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const author: string = request.query.authors as string;
    if (validationFunctions.isStringProvided(author)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing author - please refer to documentation',
        });
    }
}

function mwValidAuthorDeleteQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const Author: string = request.params.author as string;
    if (validationFunctions.isStringProvided(Author)) {
        next();
    } else {
        console.error('Invalid or missing Author');
        response.status(400).send({
            message:
                'Invalid or missing Author - please refer to documentation',
        });
    }
}
function myValidPublicationYearQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const publishedYear: string = request.query.publication_year as string;
    if (
        validationFunctions.isNumberProvided(publishedYear) &&
        publishedYear.length == 4
    ) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing publication_year - please refer to documentation',
        });
    }
}


function myValidIsbn13Param(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const ISBN: string = request.params.isbn13 as string;
    if (validationFunctions.isNumberProvided(ISBN) && ISBN.length == 13) {
        next();
    } else {
        console.error('Invalid or missing isbn13');
        response.status(400).send({
            message: 'Invalid or missing isbn13 - please refer to documentation',
        });
    }
}

function myValidTitleParam(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const title: string = request.params.title as string;
    if (
        validationFunctions.isStringProvided(title) &&
        !validationFunctions.isNumber(title)
    ) {
        next();
    } else {
        console.error('Invalid or missing title');
        response.status(400).send({
            message: 'Invalid or missing Title - please refer to documentation',
        });
    }
}

function mwValidRatingAverageQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const ratingAvg: string = request.query.rating_avg as string;
    if (validationFunctions.isNumberProvided(ratingAvg)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing rating_avg - please refer to documentation',
        });
    }
}

const validateUpdateRequest = (req: Request) => {
    const {
        title,
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
    } = req.body;
    const ratings = {
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
    };

    // Check if title is provided and at least one rating count is present
    if (
        !title ||
        (rating_1_star == null &&
            rating_2_star == null &&
            rating_3_star == null &&
            rating_4_star == null &&
            rating_5_star == null)
    ) {
        return {
            valid: false,
            message: 'At least one rating count must be provided',
        };
    }

    for (const [key, value] of Object.entries(ratings)) {
        if (value != null && (!Number.isInteger(value) || value < 0)) {
            return {
                valid: false,
                message: 'Rating counts must be non-negative integers',
            };
        }
    }

    return { valid: true };
};

const checkBookExists = async (title: string) => {
    const query = 'SELECT * FROM Books WHERE title = $1';
    const values = [title];

    const result = await pool.query(query, values);
    return result.rowCount > 0; // Returns true if the book exists
};

// Section 3: API Endpoints

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /library/add Request to add an entry
 *
 * @apiDescription Request to add a book to the DB
 *
 * @apiName PostBook
 * @apiGroup Library
 *
 * @apiBody {number} isbn13 isbn13 *unique
 * @apiBody {string} title Title of the book *unique
 * @apiBody {string} author Author of the book
 * @apiBody {number} publicationYear The publication year
 * @apiBody {number} [totalRatings] total number of ratings
 * @apiBody {number} [oneStar] number of 1 star reviews
 * @apiBody {number} [twoStar] number of 2 star reviews
 * @apiBody {number} [threeStar] number of 3 star reviews
 * @apiBody {number} [fourStar] number of 4 star reviews
 * @apiBody {number} [fiveStar] number of 5 star reviews
 * @apiBody {string} imageSmallURL the url to the small image of the book
 * @apiBody {string} imageLargeURL the url to the large image of the book
 *
 * @apiSuccess (Success 201) {JSON} Book The entered book object
 *
 * @apiError (400: isbn13 exists) {String} message "isbn13 already exists"
 * @apiError (400: Title exists) {String} message "Title already exists"
 * @apiError (400: Invalid isbn13) {String} message "Invalid or Missing isbn13 - please refer to documentation"
 * @apiError (400: Invalid title) {String} message "Invalid or Missing book title - please refer to documentation"
 * @apiError (400: Invalid author) {String} message "Invalid or Missing book author - please refer to documentation"
 * @apiError (400: Invalid publication year) {String} message "Invalid or Missing publication year - please refer to documentation"
 * @apiError (400: Invalid small url) {String} message "Invalid or missing small image url - please refer to the documentation"
 * @apiError (400: Invalid large url) {String} message "Invalid or missing large image url - please refer to the documentation"
 * @apiError (400: Invalid Parameters) {String} message "Invalid or Missing required information - please refer to documentation"
 * @apiUse JSONError
 */
//mwValidNameMessageBody,
libraryRouter.post(
    '/add',
    (request: Request, response: Response, next: NextFunction) => {
        const ISBN: number = request.body.ISBN as number;

        if (
            String(ISBN).length == 13 &&
            validationFunctions.isNumberProvided(ISBN)
        ) {
            //next();
        } else {
            console.error('Invalid isbn13');
            return response.status(400).send({
                message:
                    'Invalid or missing isbn13 - please refer to documentation',
            });
        }
        const Title: string = request.body.title as string;
        if (validationFunctions.isStringProvided(Title)) {
            //next();
        } else {
            console.error('Invalid book title');
            return response.status(400).send({
                message:
                    'Invalid or missing book title - please refer to documentation',
            });
        }
        const Author: string = request.body.author as string;
        if (validationFunctions.isStringProvided(Author)) {
            //next();
        } else {
            console.error('Invalid book Author');
            return response.status(400).send({
                message:
                    'Invalid or missing book author - please refer to documentation',
            });
        }
        const Date: string = request.body.publicationYear as string;
        if (validationFunctions.isNumberProvided(Date)) {
            //next();
        } else {
            console.error('Invalid publiciation year');
            return response.status(400).send({
                message:
                    'Invalid or missing publication year - please refer to documentation',
            });
        }
        const imageSmallURL: string = request.body.imageSmallURL as string;
        if (validationFunctions.isStringProvided(imageSmallURL)) {
            //next();
        } else {
            console.error('Invalid small url');
            return response.status(400).send({
                message:
                    'Invalid or missing small image url - please refer to the documentation',
            });
        }
        const imageLargeURL: string = request.body.imageLargeURL as string;
        if (validationFunctions.isStringProvided(imageLargeURL)) {
            //next();
        } else {
            console.error('Invalid large url');
            return response.status(400).send({
                message:
                    'Invalid or missing large image url - please refer to the documentation',
            });
        }
        next();
    },
    //Method to calculate average rating.
    (request: Request, response: Response, next: NextFunction) => {
        //generate average
        const totalRatings: number = request.body?.totalRatings as number;
        const oneStar: number = request.body?.oneStar as number;
        const twoStar: number = request.body?.twoStar as number;
        const threeStar: number = request.body?.threeStar as number;
        const fourStar: number = request.body?.fourStar as number;
        const fiveStar: number = request.body?.fiveStar as number;

        let averageRating: number;
        if (
            validationFunctions.isNumberProvided(totalRatings) &&
            validationFunctions.isNumberProvided(oneStar) &&
            validationFunctions.isNumberProvided(twoStar) &&
            validationFunctions.isNumberProvided(threeStar) &&
            validationFunctions.isNumberProvided(fourStar) &&
            validationFunctions.isNumberProvided(fiveStar)
        ) {
            if (
                totalRatings < 0 ||
                oneStar < 0 ||
                twoStar < 0 ||
                threeStar < 0 ||
                fourStar < 0 ||
                fiveStar < 0
            ) {
                console.error('Rating counts must be non-negative integers');
                return response.status(400).send({
                    message: 'Rating counts must be non-negative integers',
                });
            } else {
                averageRating =
                    (fiveStar * 5 +
                        fourStar * 4 +
                        threeStar * 3 +
                        twoStar * 2 +
                        oneStar) /
                    totalRatings;
            }
        } else {
            averageRating = null;
        }
        request.body.averageRating = averageRating;
        next();
    },
    (request: Request, response: Response) => {
        const theQuery =
            'INSERT INTO BOOKS(isbn13, authors, publication_year, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
        const values = [
            request.body.ISBN,
            request.body.author,
            request.body.publicationYear,
            request.body.title,
            request.body.averageRating,
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
                const Book = {
                    ISBN: request.body.ISBN,
                    author: request.body.author,
                    date: request.body.publicationYear,
                    title: request.body.title,
                    AverageRating: request.body.averageRating,
                    totalRatings: request.body.totalRatings,
                    oneStar: request.body.oneStar,
                    twoStar: request.body.twoStar,
                    threeStar: request.body.threeStar,
                    fourStar: request.body.fourStar,
                    fiveStar: request.body.fiveStar,
                    imageBigURL: request.body.imageBigURL,
                    imageSmallURL: request.body.imageSmallURL,
                };
                return response.status(201).send({
                    Book,
                });
            })

            .catch((error) => {
                if (
                    error.detail != undefined &&
                    error.detail.includes('already exists') &&
                    error.detail.includes('title')
                ) {
                    console.error('Title exists');
                    return response.status(400).send({
                        message: 'Title already exists',
                    });
                } else if (
                    error.detail != undefined &&
                    error.detail.includes('already exists') &&
                    error.detail.includes('isbn')
                ) {
                    console.error('isbn13 exists');
                    return response.status(400).send({
                        message: 'isbn13 already exists',
                    });
                } else {
                    console.error('DB Query error on POST');
                    console.error(error);
                    return response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    }
);

/**
 * @api {put} /library/update/ratings Request to update book rating
 * @apiDescription Updates the count of star ratings for a book by title
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
 * @apiError (404: Book Not Found) {String} message "Book title not found"
 * @apiError (400: Missing Parameters) {String} message "At least one rating count must be provided"
 * @apiError (400: Invalid Rating Count) {String} message "Rating counts must be non-negative integers"
 * @apiUse JSONError
 */
libraryRouter.put('/update/ratings', async (req: Request, res: Response) => {
    const {
        title,
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
    } = req.body;

    try {
        // First, check if the book exists
        const bookExists = await checkBookExists(title);
        if (!bookExists) {
            return res.status(404).send({ message: 'Book title not found' });
        }

        // If the book exists, validate the rating counts
        const validation = validateUpdateRequest(req);
        if (!validation.valid) {
            return res.status(400).send({ message: validation.message });
        }

        // Construct the update query dynamically based on provided rating counts
        const setClauses = [];
        const values = [title];
        let counter = 2;

        const ratings = {
            rating_count,
            rating_1_star,
            rating_2_star,
            rating_3_star,
            rating_4_star,
            rating_5_star,
        };
        for (const [key, value] of Object.entries(ratings)) {
            if (value != null) {
                setClauses.push(`${key} = $${counter}`);
                values.push(value);
                counter++;
            }
        }

        const updateQuery = `
            UPDATE Books
            SET ${setClauses.join(', ')}
            WHERE title = $1
                RETURNING *;
        `;

        await pool.query(updateQuery, values);
        res.status(200).send({ message: "Book's ratings have been updated" });
    } catch (error) {
        console.error('Error updating book ratings:', error);
        res.status(500).send({
            message: 'Server error - please contact support',
        });
    }
});

/**
 * @api {delete} /library/remove/ISBN/:isbn13 Request to remove book entries by isbn13
 *
 * @apiDescription Request to remove all entries of <code>isbn13</code>
 *
 * @apiName Deleteisbn13
 * @apiGroup Library
 *
 * @apiParam {number} isbn13 The isbn13 of the book to remove
 *
 *
 * @apiSuccess {String[]} entries The list of deleted entries, formatted as:
 *      "ISBN: <code>isbn</code>, Title: <code>title</code>"
 *
 * @apiError (400: Invalid or missing isbn13) {String} message "Invalid or missing isbn13 - please refer to documentation"
 * @apiError (404: No isbn13 found) {String} message "No book for isbn13 ${request.params.isbn13} found"
 */
libraryRouter.delete(
    '/remove/ISBN/:isbn13',
    myValidIsbn13Param,
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM BOOKS WHERE isbn13 = $1 RETURNING *'; //Remember to change table name!
        const values = [request.params.isbn13];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows.map(format),
                    });
                } else {
                    return response.status(404).send({
                        message: `No book for isbn13 ${request.params.isbn13} found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by isbn13');
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
 * @apiError (404: Author Not Found) {String} message "No book associated with this author was found"
 */
libraryRouter.delete(
    '/remove/author/:author',
    mwValidAuthorDeleteQuery,
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM BOOKS WHERE authors = $1 RETURNING *';
        const values = [request.params.author];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows.map(format),
                    });
                } else {
                    response.status(404).send({
                        message:
                            'No book associated with this author was found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by isbn13');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

/**
 * @api {get} /library/retrieve Request to retrieve all books
 *
 * @apiDescription Request to retrieve the information about all books
 *
 * @apiName RetrieveAllBooks
 * @apiGroup Library
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>authors</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (404: Books Not Found) {string} message "Book not found"
 *
 */
libraryRouter.get('/retrieve', (request: Request, response: Response) => {
    const theQuery =
        'SELECT title, authors, isbn13, publication_year, rating_avg, rating_count FROM BOOKS';

    pool.query(theQuery)
        .then((result) => {
            if (result.rowCount > 0) {
                response.send({
                    entries: result.rows.map(format),
                });
            } else {
                response.status(404).send({
                    message: 'Book not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET retrieve');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {get} /library/isbn13/:isbn13 Request to retrieve a book by isbn13
 *
 * @apiDescription Request to retrieve a specific book by <code>isbn13</code>. 
 *
 * @apiName GetBookIsbn
 * @apiGroup Library
 *
 * @apiParam {number} isbn13 the isbn13 to look up the specific book.
 * 
 * @apiSuccess {Object} entry the message book object for <code>isbn13</code>
 * @apiSuccess {number} entry.isbn13 <code>isbn13</code>
 * @apiSuccess {string} entry.authors the author of the book associated with <code>isbn13</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>isbn13</code>
 * @apiSuccess {string} entry.title the book title associated with <code>isbn13</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>isbn13</code>

 *
 * @apiError (400: Invalid isbn13) {String} message "Invalid or missing isbn13  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this isbn13 was found"
 *
 */
libraryRouter.get(
    '/isbn13/:isbn13',
    myValidIsbn13Param,
    (request: Request, response: Response) => {
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
                        message: 'No book associated with this isbn13 was found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /:isbn13');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);
/**
 * @api {get} /library/title/:title Request to retrieve a book by title
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
 * @apiSuccess {string} entry.authors the author of the book associated with <code>title</code>
 * @apiSuccess {number} entry.publication_year the published year of the book associated with <code>title</code>
 * @apiSuccess {string} entry.title the book title associated with <code>title</code>
 * @apiSuccess {number} entry.rating_avg The average rating of the book associated with <code>title</code>
 * 
 *
 * @apiError (400: Invalid title) {String} message "Invalid or missing title  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this title was found"
 *
 */
libraryRouter.get(
    '/title/:title',
    myValidTitleParam,
    (request: Request, response: Response) => {
        const theQuery =
            'SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS where title = $1';
        const values = [request.params.title];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 1) {
                    response.send({
                        entry: result.rows[0],
                    });
                } else {
                    response.status(404).send({
                        message: `No book associated with this title was found`,
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
 * @api {get} /library?authors= Request to retrieve books by author's name
 *
 * @apiDescription Request to retrieve the information about all books written by <code>author</code>.
 *
 * @apiName GetBookAuthor
 * @apiGroup Library
 *
 * @apiQuery {string} authors the author to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>authors</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (400: Invalid author) {String} message "Invalid or missing author  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this author was found"
 *
 */

libraryRouter.get('/', (request: Request, response: Response, next) => {
    const publishedYear: string = request.query.publication_year as string;
    const ratingAvg: string = request.query.rating_avg as string;
    const author: string = request.query.authors as string;
    if (author && !ratingAvg && !publishedYear) {
        myValidAuthorQuery(request, response, () => {
            const theQuery =
                "SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS WHERE authors LIKE '%' || $1 || '%'";
            const values = [request.query.authors];
            pool.query(theQuery, values)
                .then((result) => {
                    if (result.rowCount > 0) {
                        return response.send({
                            entries: result.rows.map(format),
                        });
                    } else {
                        return response.status(404).send({
                            message: `No book associated with this author was found`,
                        });
                    }
                })
                .catch((error) => {
                    //log the error
                    console.error('DB Query error on GET by author');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                });
        });
    } else {
        next();
    }
});

/**
 * @api {get} /library?publication_year= Request to retrieve books by original publication year
 *
 * @apiDescription Request to retrieve the information about all books published in <code>publication_year</code>.
 *
 * @apiName GetBookPublicationYear
 * @apiGroup Library
 *
 * @apiQuery {number} publication_year the publication year to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>author</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (400: Invalid publication year) {String} message "Invalid or missing publication_year  - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this publication year was found"
 *
 */

libraryRouter.get('/', (request: Request, response: Response, next) => {
    const publishedYear: string = request.query.publication_year as string;
    const ratingAvg: string = request.query.rating_avg as string;
    const authors: string = request.query.authors as string;
    if (publishedYear && !ratingAvg && !authors) {
        myValidPublicationYearQuery(request, response, () => {
            const theQuery =
                'SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS where publication_year = $1';
            const values = [request.query.publication_year];
            pool.query(theQuery, values)
                .then((result) => {
                    if (result.rowCount > 0) {
                        response.send({
                            entries: result.rows.map(format),
                        });
                    } else {
                        response.status(404).send({
                            message: `No book associated with this publication year was found`,
                        });
                    }
                })
                .catch((error) => {
                    //log the error
                    console.error('DB Query error on GET by publication_year');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                });
        });
    } else {
        next();
    }
});

/**
 * @api {get} /library?rating_avg= Request to retrieve books by rating average
 *
 * @apiDescription Request to retrieve the information about all books with the given <code>rating_avg</code>
 *
 * @apiName RetrieveByRatingAvg
 * @apiGroup Library
 *
 * @apiQuery {number} rating_avg the rating_avg to look up.
 *
 * @apiSuccess {String[]} entries the aggregate of all entries as the following string:
 *      "{<code>title</code>} by <code>authors</code> - ISBN: <code>isbn13</code>, published in <code>publication_year</code>, average rating: <code>rating_avg</code>"
 *
 * @apiError (400: Invalid rating_avg) {string} message "Invalid or missing rating_avg - please refer to documentation"
 * @apiError (404: Book Not Found) {string} message "No book associated with this rating_avg was found"
 *
 */
libraryRouter.get(
    '/',
    mwValidRatingAverageQuery,
    (request: Request, response: Response) => {
        const theQuery =
            'SELECT isbn13, authors, publication_year, title, rating_avg FROM BOOKS where rating_avg = $1';
        const values = [request.query.rating_avg];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        entries: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: `No book associated with this rating_avg was found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET by rating_avg');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);
// "return" the router
export { libraryRouter };
