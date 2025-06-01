class ApiErro extends Error {
    constructor(
        statusCode, 
        message = "An error occurred" ,
        error = [] ,
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.data = null;
        this.sussess = false;

        if (stack) {
            this.stack = stack;

        }else {
            Error.captureStackTrace(this, this.constructor);
        }
        
    }

}

export {ApiErro}