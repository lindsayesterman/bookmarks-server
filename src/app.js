require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const winston = require('winston');
const { v4: uuid } = require('uuid');

const app = express()

const morganOption = (NODE_ENV === 'production')
? 'tiny'
: 'common';

const bookmarks = [{
    id: 1,
    title: 'Bookmark One',
    url: 'https://bookmarks-app-snowy.vercel.app/add-bookmark',
    description: 'This is bookmark one',
    rating: '5'
}];


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json());
app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')
    
    
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.get('/bookmark', (req, res) => {
    res
    .json(bookmarks)
});

app.get('/bookmark/:id', (req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(c => c.id == id);
    
    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Not Found');
    }
    
    res.json(bookmark);
});

app.post('/bookmark', (req,res) => {
    const { title, url, description, rating } = req.body;
    
    if  (!title) {
        logger.error(`title is required`);
        return res
        .status(400)
        .send('Invalid data');
    }
    
    if (!url) {
        logger.error(`url is required`);
        return res
        .status(400)
        .send('Invalid data');
    }
    
    const id = uuid();
    
    const bookmark = {
        id,
        title,
        url, 
        description,
        rating
    };
    
    bookmarks.push(bookmark);
    
    logger.info(`Bookmark with id ${id} created`);
    res
    .status(201)
    .location(`http://localhost:8000/bookmark/${id}`)
    .json(bookmark);
})

app.delete('/bookmark/:id', (req, res) => {
    const { id } = req.params;
    
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);
    
    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Not Found');
    }
    
    bookmarks.splice(bookmarkIndex, 1);
    
    logger.info(`Bookmark with id ${id} deleted.`);
    res
    .send(`Bookmark with id ${id} deleted.`)
    .end();
});

module.exports = app