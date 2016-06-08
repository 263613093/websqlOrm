class dbContext {
    private db: Database;
    constructor() {
        if (window.openDatabase) {
            this.db = window.openDatabase("lt_db", "", "lt_db", 1024 * 1024);
        }
    }
    /**
     * 获取参数
     * @param {baseEntity} v
     * @returns
     */
    private getProperties(v: any) {
        var properties = new Array<string>();
        for (var key in v) {
            if (typeof (v[key]) === "function") continue;
            properties.push(key);
        }
        return properties;
    }
    /**
     * 格式化日期
     * @param {string} v
     * @returns
     */
    private formatTime(v: string) {
        var re = /-?\d+/;
        var m = re.exec(v);
        var d = new Date(parseInt(m[0]));
        var format = "yyyy-MM-dd hh:mm:ss";
        var o = {
            "M+": d.getMonth() + 1, //month
            "d+": d.getDate(),    //day
            "h+": d.getHours(),   //hour
            "m+": d.getMinutes(), //minute
            "s+": d.getSeconds(), //second
            "q+": Math.floor((d.getMonth() + 3) / 3),  //quarter
            "S": d.getMilliseconds() //millisecond
        }
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
            (d.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o) if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                    ("00" + o[k]).substr(("" + o[k]).length));
        return format;
    }


    private createTable<T extends baseEntity>(table: string, data: T) {
        if (!this.db) return;
        var properties = this.getProperties(data);
        this.db.transaction(trans => {
            trans.executeSql("create table if not exists " + table + "(" + properties.toString() + ")");
        });
    }
    /**
     * 添加数据
     * @param {string} table
     * @param {T} data
     */
    Insert<T extends baseEntity>(table: string, data: T) {
        if (!this.db) return;
        this.createTable(table, data);
        var properties = this.getProperties(data);
        var values = new Array<string>();
        var valueArr = new Array<any>();
        properties.forEach(t => {
            values.push("?");
            if (typeof (data[t]) == "string" && data[t].match(/\/Date\(-?\d+\)\//)) {
                valueArr.push(this.formatTime(data[t]));
                return true;
            }
            valueArr.push(data[t]);
        });
        var sql = "insert into " + table + "(" + properties.toString() + ")values(" + values.toString() + ")";
        this.db.transaction(trans => {
            trans.executeSql(sql, valueArr, (t, r) => {
                console.log("添加行数：" + r.rowsAffected);
            });
        });
    }
    /**
     * 更新数据
     * @param {string} table
     * @param {T} data
     */
    Update<T extends baseEntity>(table: string, data: T, predicate: { [index: string]: any }) {
        if (!this.db) return;
        this.createTable(table, data);
        var properties = this.getProperties(data);
        var column = new Array<string>();
        var values = new Array<any>();
        properties.forEach(t => {
            column.push(t + "=?");
            if (typeof (data[t]) == "string" && data[t].match(/\/Date\(-?\d+\)\//)) {
                values.push(this.formatTime(data[t]));
                return true;
            }
            values.push(data[t]);
        });
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        whereProperties.forEach(t => {
            where.push(t + "=?");
            values.push(predicate[t]);
        });
        var sql = "update " + table + " set " + column.toString();
        if (where.length > 0) {
            sql += " where 1=1 and " + where.join(" and ");
        }
        this.db.transaction(trans => {
            trans.executeSql(sql, values, (t, r) => {
                console.log("更新行数:" + r.rowsAffected);
            }, (t, e) => {
                console.log(e.message);
                return false;
                });
        });
    }

    /**
     * 根据ID查询一条数据
     * @param {string} table
     * @param {string} id
     * @param {(v} callback
     */
    Single<T extends baseEntity>(table: string, predicate: { [index: string]: any }, callback: (v: T) => void) {
        if (!this.db) return;
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        var values = new Array<any>();
        whereProperties.forEach(t => {
            where.push(t + "=?");
            values.push(predicate[t]);
        });
        this.db.transaction(trans => {
            trans.executeSql("select * from " + table + " where " + where.join(" and "), values, (t, r) => {
                if (r.rows.length > 0) {
                    callback(r.rows.item(0) as T);
                }
            });
        });
    }
    /**
     * 根据条件查询数据是否存在
     * @param {string} table
     * @param {{ [index} predicate
     * @param {(v} callback
     */
    Exist(table: string, predicate: { [index: string]: any }, callback: (v: boolean) => void) {
        if (!this.db) return;
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        var values = new Array<any>();
        whereProperties.forEach(t => {
            where.push(t + "=?");
            values.push(predicate[t]);
        });
        this.db.transaction(trans => {
            trans.executeSql("select count(*) as count from " + table + " where " + where.join(" and "), values, (t, r) => {
                var count = r.rows.item(0).count;
                callback(count > 0);
            });
        });
    }
    /**
     * 删除匹配条件的数据
     * @param {string} table
     * @param {{ [index} predicate
     * @param {function} callback
     */
    Remove(table: string, predicate: { [index: string]: any }, callback: () => void) {
        if (!this.db) return;
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        var values = new Array<any>();
        whereProperties.forEach(t => {
            where.push(t + "=?");
            values.push(predicate[t]);
        });
        this.db.transaction(trans => {
            trans.executeSql("delete from " + table + " where " + where.join(" and "), values, (t, r) => {
                callback();
            });
        });
    }
    /**
     * 根据条件查询数量
     * @param {string} table
     * @param {{ [index} predicate
     * @param {(v} callback
     */
    Count(table: string, predicate: { [index: string]: any }, callback: (v: number) => void) {
        if (!this.db) return;
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        var values = new Array<any>();
        if (whereProperties.length > 0) {
            whereProperties.forEach(t => {
                where.push(t + "=?");
                values.push(predicate[t]);
            });
        }
        this.db.transaction(trans => {
            var sql = "select count(*) as count from " + table;
            if (whereProperties.length > 0) {
                sql += " where " + where.join(" and ");
            }
            console.log("COUNT:" + sql);
            trans.executeSql(sql, values, (t, r) => {
                var count: number = r.rows.item(0).count;
                callback(count);
            });
        });
    }
    /**
     * 根据条件查询列表
     * @param {string} table
     * @param {{ [index} predicate
     * @param {number} page
     * @param {number} pagesize
     * @param {(v} callback
     * @param {function} count
     */
    Query<T extends baseEntity>(table: string, predicate: { [index: string]: any }, orderBy: {[index:string]:"asc"|"desc"}, page: number, pagesize: number, callback: (v: Array<T>, count: number) => void) {
        if (!this.db) return;
        var whereProperties = this.getProperties(predicate);
        var where = new Array<string>();
        var values = new Array<any>();
        var order = new Array<string>();
        for (var key in orderBy) {
            order.push(key + " " + orderBy[key]);
        }
        if (whereProperties.length > 0) {
            whereProperties.forEach(t => {
                values.push(predicate[t]);
                where.push(t + "=?");
            });
        }
        this.db.transaction(trans => {
            var sql_count = "select count(*) as count from " + table + (whereProperties.length > 0 ? " where " + where.join(" and ") : "");
            console.log("QUERY_COUNT:" + sql_count);
            trans.executeSql(sql_count, values, (t, r) => {
                var count: number = r.rows.item(0).count;
                var sql_query = "select * from " + table;
                if (whereProperties.length > 0) {
                    sql_query += " where " + where.join(" and ");
                }
                sql_query += " order by " + order.join(",") + " limit " + (page - 1) * pagesize + "," + pagesize;
                console.log("QUERY_LIST:"+sql_query);
                trans.executeSql(sql_query, values, (t1, r1) => {
                    var items = new Array<T>();
                    for (var i = 0; i < r1.rows.length; i++) {
                        items.push(r1.rows.item(i) as T);
                    }
                    callback(items, count);
                });
            });
        });
    }
    /**
     * 删除数据表
     * @param {string} table
     */
    dropTable(table: string) {
        if (!this.db) return;
        this.db.transaction(trans => {
            trans.executeSql("drop table " + table);
        });
    }
    /**
     * 删除数据库
     */
    dropDatabase() {
        if (!this.db) return;
        this.db.transaction(trans => {
            trans.executeSql("drop database lt_db");
        })
    }


}