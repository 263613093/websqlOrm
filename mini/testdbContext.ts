/// <reference path="dbcontext.ts" />

interface User extends baseEntity {
    Name: string;
    Password: string;
}
$(function () {
    var ctx = new dbContext();
    ctx.Insert<User>("User", {
        Id: "00000001",
        isChecked: false,
        Name: "User1",
        OpenId: "",
        Password: "0000",
        PubTime: new Date(),
        UpdateTime: new Date()
    });

    ctx.Update<User>("User", {
        Id: "00000001",
        isChecked: false,
        Name: "User1_RENAME",
        OpenId: "",
        Password: "0000",
        PubTime: new Date(),
        UpdateTime: new Date()
    }, {
            Id: "00000001"
        });


    ctx.Count("User", {}, v => {
        console.log("查询结果：" + v);
    });

    ctx.Single("User", { Id: "00000001" }, item => {
        console.log(item);
    });


    ctx.Query("User", {}, { Id: "desc" }, 1, 10, (items, count) => {
        console.log("查询到结果：" + count);
        console.log(items);
    });

    ctx.Remove("User", { Id: "00000001" }, () => {
        console.log("删除成功！");
    });
});