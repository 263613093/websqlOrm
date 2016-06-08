# websqlOrm
通过创建websql 数据库上下文对象对任意数据进行离线存储功能！

示例代码如下：

interface User extends baseEntity {
    Name: string;
    Password: string;
};

    var ctx = new dbContext();
    //新增数据，第一个参数User为表名称
    ctx.Insert<User>("User", {
        Id: "00000001",
        isChecked: false,
        Name: "User1",
        OpenId: "",
        Password: "0000",
        PubTime: new Date(),
        UpdateTime: new Date()
    });
    //更新数据
    ctx.Update<User>("User", {
        Id: "00000001",
        isChecked: false,
        Name: "User1_RENAME",
        OpenId: "",
        Password: "0000",
        PubTime: new Date(),
        UpdateTime: new Date()
    }, {
            //更新条件
            Id: "00000001"
        });

    //数据统计,第二个参数为统计条件，无条件则为{}
    ctx.Count("User", {}, v => {
        console.log("查询结果：" + v);
    });
    //查询单个，第二个参数为查询条件
    ctx.Single("User", { Id: "00000001" }, item => {
        console.log(item);
    });

    //分页查询所有数据，第二个参数为查询条件，第三个参数为排序（可以多个）,第四个参数为分页（1开始），第五个参数为查询数量
    ctx.Query("User", {}, { Id: "desc" }, 1, 10, (items, count) => {
        console.log("查询到结果：" + count);
        console.log(items);
    });
    //根据指定条件删除对象
    ctx.Remove("User", { Id: "00000001" }, () => {
        console.log("删除成功！");
    });


