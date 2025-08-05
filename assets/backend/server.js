
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;


const uploadsDir = path.join(__dirname, 'uploads');
const coversDir = path.join(uploadsDir, 'covers');
const tracksDir = path.join(uploadsDir, 'tracks');

[uploadsDir, coversDir, tracksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});


app.use(express.static(path.join(__dirname, '../../')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'coverImage') {
            cb(null, coversDir);
        } else if (file.fieldname === 'musicFiles') {
            cb(null, tracksDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'coverImage') {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
                cb(null, true);
            } else {
                cb(new Error('Only JPEG and PNG images are allowed for cover'), false);
            }
        } else if (file.fieldname === 'musicFiles') {
            if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
                cb(null, true);
            } else {
                cb(new Error('Only MP3 files are allowed for music'), false);
            }
        }
    }
});


let albums = [];


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../upload.html'));
});


app.get('/api/albums', (req, res) => {
    res.json(albums);
});


app.post('/api/upload', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'musicFiles', maxCount: 50 }
]), (req, res) => {
    try {
        const { albumName } = req.body;
        const coverImage = req.files['coverImage'][0];
        const musicFiles = req.files['musicFiles'];
        

        const album = {
            id: uuidv4(),
            name: albumName,
            cover: coverImage.filename,
            tracks: musicFiles.map(file => ({
                name: path.parse(file.originalname).name,
                file: file.filename,
                originalName: file.originalname
            })),
            uploadDate: new Date().toISOString()
        };
        
        albums.push(album);
        
        console.log(`New album uploaded: ${albumName} with ${musicFiles.length} tracks`);
        res.status(200).json({ message: 'Album uploaded successfully', album });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload album' });
    }
});


app.delete('/api/albums/:id', (req, res) => {
    const albumId = req.params.id;
    const albumIndex = albums.findIndex(album => album.id === albumId);
    
    if (albumIndex === -1) {
        return res.status(404).json({ error: 'Album not found' });
    }
    
    const album = albums[albumIndex];
    

    try {
        fs.unlinkSync(path.join(coversDir, album.cover));
        album.tracks.forEach(track => {
            fs.unlinkSync(path.join(tracksDir, track.file));
        });
    } catch (error) {
        console.error('Error deleting files:', error);
    }
    
    albums.splice(albumIndex, 1);
    res.json({ message: 'Album deleted successfully' });
});


app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ye-box server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});
