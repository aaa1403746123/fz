const express = require("express");
const router = express.Router();
const User = require("../mongo/user");
const FZ = require("../mongo/fz");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const keys = require("../config/key.js");
const xlsx = require('xlsx')
const multer = require('multer')

const upload = multer({ storage: multer.memoryStorage() }) // 上传文件使用缓存策略
// @route  POST api/users/login
// @desc   返回token jwt passport
// @access public

router.post("/login", (req, res) => {
  const account = req.body.account;
  const password = req.body.password;
  // 查询数据库

  User.find({ account })
    .then((user) => {
      if (user <= 0) {
        return res.json({ status: 400, msg: "用户不存在!" });
      }
      // 密码匹配
      bcrypt.compare(password, user[0].password).then((isMatch) => {
        if (isMatch) {
          const rule = {
            account: user.account,
          };
          jwt.sign(rule, keys.secretOrKey, (err, token) => {
            if (err) throw err;
            res.json({
              msg: "success",
              status: 200,
              token: "Bearer " + token,
              account,
            });
          });
          // res.json({msg:"success"});
        } else {
          return res.json({ status: 400, msg: "密码错误!" });
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/changePassword", (req, res) => {
  User.findOne({ account: req.body.account }).then((user) => {
    bcrypt.compare(req.body.password, user.password).then((isMatch) => {
      if (isMatch) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(req.body.cpassword, salt, (err, hash) => {
            if (err) throw err;
            let newpassword = hash;
            User.findByIdAndUpdate(
              user._id,
              { password: newpassword },
              function (err, response) {
                if (err) {
                  res.json({ status: 400, msg: "修改失败,服务器错误" });
                } else {
                  res.json({ status: 200, msg: "修改成功" });
                }
              }
            );
          });
        });
      } else {
        return res.json({ status: 400, msg: "原始密码错误!" });
      }
    });
  });
});
router.post("/getZKList", function (req, res) {

  let query = req.body;
  let page = query.current || 1;
      let limit = query.pageSize || 10;
    FZ.find(query).then((response) => { 
      delete query.page;
      delete query.pageSize;
      let date = new Date().getTime();
      let newData= response.sort((a, b) => {
        return (
          new Date(a.dqsj).getTime() -
          date -
          (new Date(b.dqsj).getTime() - date)
        );
      });
      let total = newData.length;
      function group(array, subGroupLength) {
        let index = 0;
        let newArray = [];
        while (index < array.length) {
          newArray.push(array.slice(index, (index += subGroupLength)));
        }
        return newArray;
      }
      let  pageData=null
      if(total>=1){
        var groupedArray = group(newData, limit);
        pageData = groupedArray[page - 1];
      }else{
        pageData=[]
      }
  
      
      return res.json({
        status: 200,
        msg: "请求成功",
        total,
        data: pageData,
      });
    });
    // FZ.find(query).skip((page - 1)*parseInt(limit)).limit(parseInt(limit)).exec(function (err, data) {
    //     if(err) return res.status(500).json({
    //         result: 1,
    //         error_info: '服务器繁忙，请稍后重试！'
    //     })
    //     return res.json({
    //        status:200,
    //         msg:'请求成功',
    //         total: count,
    //         data
    //     })
    // })
  
});
router.post("/addzk", function (req, res) {
  let val = req.body;
  let user = new FZ(val);
  user
    .save()
    .then((response) => {
      res.json({ status: 200, msg: "添加成功" });
    })
    .catch((err) => {
      res.json({ status: 400, msg: "添加失败" });
    });
});
router.post("/editzk", function (req, res) {
  let val = req.body;
  FZ.findByIdAndUpdate(val._id, val, function (err, response) {
    if (err) {
      res.json({ status: 400, msg: "修改失败,服务器错误" });
    } else {
      res.json({ status: 200, msg: "修改成功" });
    }
  });
});
router.post("/deletezk", function (req, res) {
  let val = req.body;
  FZ.findByIdAndRemove({ _id: val._id }, function (err, response) {
    if (err) {
      res.json({ status: 400, msg: "删除失败,服务器错误" });
    } else {
      res.json({ status: 200, msg: "删除成功" });
    }
  });
});
// 上传excel
router.post("/upload_excel",upload.any(), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.json({ text: '请选择文件上传' })
    }

    const { originalname, buffer } = req.files[0]
    if (!originalname.endsWith('xls') && !originalname.endsWith('xlsx')) {
      return res.json({ text: '请上传xls或xlsx格式的文件' })
    }
    // 解析excel文件
    const workbook = xlsx.read(buffer, { type: "buffer" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]] // 选择第一个工作簿
    const result = xlsx.utils.sheet_to_json(sheet)
    console.log(result);
   //return res.json(result)
  })
module.exports = router;
