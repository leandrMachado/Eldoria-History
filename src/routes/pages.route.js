const router = require('express').Router();
const Historys = require('../services/historys.processor');
const User = require('../services/user.processor');

router.get("/", (req, res, next) => {
    if (req.isAuthenticated()) 
        return res.status(200).redirect("/pages/dashboard");

    res.status(200).render('access')
});

router.get('/dashboard/editor', (req, res, next) => {
    if (!req.isAuthenticated()) 
        return res.status(200).redirect("/pages");

    new User().get({ email_: req.user.email }).then(user => {
        res.status(200).render('building/dashboard', { username: user.username, email: user.email })
    });
});

router.get('/dashboard', (req, res, next) => {
    if (!req.isAuthenticated()) 
        return res.status(200).redirect("/pages");

    new User().get({ email_: req.user.email }).then(user => {
        res.status(200).render('dashboard', { username: user.username })
    });
});

router.get('/dashboard/editor/docs', (req, res, next) => {
    if (!req.isAuthenticated()) 
        return res.status(200).redirect("/pages");

    res.status(200).render('building/documents')
});

router.get('/dashboard/historys', (req, res, next) => {
    if (!req.isAuthenticated()) 
        return res.status(401).redirect('/pages');

    new User().get({ email_: req.user.email }).then(user => {
        const user_progress = [ ...user.user_progress ].map(progress_ => JSON.parse(progress_));
        
        Historys.listHistorys((err, historys) => {
            if (err) next(err);
            
            const historys_ = [ ...historys ];

            for (const index in historys_) {
                const progress_index = user_progress.findIndex(book => book.name === historys_[index].slug);

                if (user_progress.length != 0)
                    historys_[index].continue = (user_progress[progress_index].page != 1) ? true : false
                else
                    historys_[index].continue = false;
            }
        
            res.status(200).render('historys/dashboard', { username: req.user.username, hasSaveGame: false, historys })
        })
    })
});

router.get('/playground/:history', (req, res, next) => {
    if (!req.isAuthenticated()) 
        return res.status(401).redirect('/pages');
    
    new User().get({ email_: req.user.email }).then(user => {
        const user_progress = [ ...user.user_progress ].map(progress_ => JSON.parse(progress_));
        const progress_index = user_progress.findIndex(book => book.name === req.params.history);

        res.status(200).render('historys/playground', { 
            username: req.user.username, 
            history: req.params.history,
            page: (progress_index !== -1) ? user_progress[progress_index].page : "1"
        });

    })
});

module.exports = router;