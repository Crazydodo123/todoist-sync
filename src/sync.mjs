import todo from "./todo.mjs"
import google from "./google.mjs"

const todoList = await todo.getAllTasks()

const googleTasks = await google.getProjects()

console.log(googleTasks)