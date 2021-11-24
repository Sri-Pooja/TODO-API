const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbpath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db error: ${e.message}`);
  }
};

initializeDbandServer();

///todo/ get

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasTodo = (requestBody) => {
  return requestBody.todo !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//get specific todo based on the todo id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
        SELECT * 
        FROM todo 
        WHERE id = ${todoId}
    `;
  const todo = await db.get(getTodo);
  response.send(todo);
});

//create todo in the todo table

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
        INSERT INTO todo (id, todo, priority, status)
        VALUES (${id}, "${todo}", "${priority}", "${status}");
    `;
  await db.run(createTodo);
  response.send("Todo Successfully Added");
});

//update specific todo based on the todo id

app.put("/todos/:todoId/", async (request, response) => {
  const { todo, priority, status } = request.body;
  const { todoId } = request.params;
  let updateTable = null;

  switch (true) {
    case hasPriorityProperty(request.body):
      updateTable = `
            UPDATE todo 
            SET priority = "${priority}"
            WHERE id = ${todoId};
            `;
      await db.run(updateTable);
      response.send("Priority Updated");
      break;
    case hasStatusProperty(request.body):
      updateTable = `
            UPDATE todo 
            SET status = "${status}"
            WHERE id = ${todoId};
        `;
      await db.run(updateTable);
      response.send("Status Updated");
      break;
    case hasTodo(request.body):
      updateTable = `
            UPDATE todo
            SET todo = "${todo}"
            WHERE id = ${todoId}
        `;
      await db.run(updateTable);
      response.send("Todo Updated");
      break;
  }
});
// deletes a todo from the todo table based on the todo id

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
