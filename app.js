const express = require('express') // require -> commonJS
const movies = require('./movies.json')
const crypto = require('node:crypto') // biblioteca nativa, permite crear IDs
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js')
const cors = require('cors')

const app = express()

app.disable('x-powered-by') // Deshabilita el header X-Powered-By: Express (por seguridad)
app.use(express.json())
// Middleware -> manejo de los errores de CORS
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://127.0.0.1:5500',
            'http://localhost:1234'
        ]

        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    }
}))

app.get('/movies', (req, res) => {
    const { genre } = req.query

    if (genre) {
        const filteredMovies = movies.filter(movie => {
            movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        })

        return res.json(filteredMovies)
    }

    res.json(movies)
})

app.get('/movies/:id', (req, res) => {
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)

    if (movie) return res.json(movie)
    res.status(404).json({ message: "Movie not Found" })
})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)

    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newMovie = {
        id: crypto.randomUUID(), // crea un UUID v4
        ...result.data
    }

    movies.push(newMovie)
    res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not Found' })
    }

    movies.splice(movieIndex, 1)
    return res.json({ message: 'Movie Deleted' })
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)
    
    if (!result.success) {
        return res.status(404).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) return res.status(404).json({ message: 'Movie not Found' })

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie
    return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234 // variable de entorno, valor por defecto: 1234

app.listen(PORT, () => {
    console.log(`\nserver listening on port -> http://localhost:${PORT}`)
})
