const express=require("express")
const router=express.Router();

router.get("/",(req,res)=>{
    res.render("home")
})

router.get("/signup", (req, res) => {
  res.render("signup", {
    redirectTo: req.query.redirectTo
  });
});

router.get("/login", (req, res) => {
  res.render("login", {
    redirectTo: req.query.redirectTo
  });
});


router.get("/nim", (req, res) => {
  res.render("games/nim/home");
});

module.exports=router