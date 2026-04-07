const express=require("express")
const router=express.Router();

router.get("/",(req,res)=>{
    res.render("home")
})

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.get("/login", (req, res) => {
  res.render("login");
});


router.get("/nim", (req, res) => {
  res.render("games/nim/home");
});

module.exports=router