export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = err.message;

    if(err.name === 'ValidationError'){
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(', ');
    }

    if(err.code === 11000){
        statusCode = 400;
        message = 'Email already in use';
    }

    if(err.name === 'CastError'){
        statusCode = 400;
        message = 'Invalid id';
    }

    res.status(statusCode).json({
        message, 
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};