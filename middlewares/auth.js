const {getUser}=require("../services/auth")
async function restrictToLoggedinUserOnly(req, res, next) {
    const userUid = req.cookies?.uid;

    if (!userUid) {
        return res.redirect(
            `/login?redirectTo=${encodeURIComponent(req.originalUrl)}`
        );
    }

    const user = getUser(userUid);

    if (!user) {
        return res.redirect(
            `/login?redirectTo=${encodeURIComponent(req.originalUrl)}`
        );
    }

    req.user = user;
    next();
}

async function checkAuth(req,res,next) {
    const userUid=req.cookies?.uid
    const user=getUser(userUid)
    req.user=user
    next()
}
module.exports={
    restrictToLoggedinUserOnly,
    checkAuth
}
