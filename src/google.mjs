import axios from "axios"
import { configDotenv } from "dotenv"

configDotenv({ path: '../.env'})

const refreshAccessToken = async () => {
    const options = {
        method: 'POST',
        url: 'https://oauth2.googleapis.com/token',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        data: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            refresh_token: process.env.REFRESH_TOKEN
        })
    }

    const response = await axios.request(options)
    const new_access_token = response.data.access_token

    process.env.ACCESS_TOKEN = new_access_token
    return new_access_token
}

const getProjects = async () => {
    try {
        const response = await axios.get("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
            headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
        })
        return response.data.items

    } catch {
        await refreshAccessToken()
        const response = await axios.get("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
            headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
        })
        return response.data.items
    }
}

const addProject = async (name) => {
    const response = await axios.post("https://tasks.googleapis.com/tasks/v1/users/@me/lists", { title: name }, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

const deleteProject = async (project) => {
    const response = await axios.delete(`https://tasks.googleapis.com/tasks/v1/users/@me/lists/${project.id}`, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

const getTasksFromProjectId = async (id) => {
    const response = await axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${id}/tasks`, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data.items.filter(task => task.status !== 'completed')
}

const getTasksFromProjectName = async (projectName) => {
    const googleProjects = await getProjects()
    const googleProject = googleProjects.filter(googleProject => googleProject.title === projectName)[0]
    return await getTasksFromProjectId(googleProject.id).filter(task => task.status !== 'completed')
}

const addTaskToProject = async (task, projectId) => {
    const response = await axios.post(`https://tasks.googleapis.com/tasks/v1/lists/${projectId}/tasks`, task, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

const checkCompleted = async (task, project) => {
    const response = await axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${project.id}/tasks/${task.id}`, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return !!response.data.completed
}

const findTaskByTaskName = (taskName, projectId, projects) => {
    const project = projects.find(project => project.id === projectId)
    if (!project) return undefined
    
    const task = project.tasks.find(task => task.title === taskName)

    return task
}

const completeTask = async (task, project) => {
    const response = await axios.patch(`https://tasks.googleapis.com/tasks/v1/lists/${project.id}/tasks/${task.id}`, { status: "completed" }, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

const updateTask = async (updatedTask, project) => {
    const response = await axios.put(`https://tasks.googleapis.com/tasks/v1/lists/${project.id}/tasks/${updatedTask.id}`, updatedTask, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

const deleteTask = async (task, project) => {
    const response = await axios.delete(`https://tasks.googleapis.com/tasks/v1/lists/${project.id}/tasks/${task.id}`, {
        headers: {"Authorization" : `Bearer ${process.env.ACCESS_TOKEN}`}
    })

    return response.data
}

export default { refreshAccessToken, getProjects, addProject, deleteProject, getTasksFromProjectId, getTasksFromProjectName, addTaskToProject, checkCompleted, findTaskByTaskName, completeTask, updateTask, deleteTask }