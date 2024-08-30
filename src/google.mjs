import axios from "axios"
import { configDotenv } from "dotenv"

configDotenv({ path: '../.env'})

const getAccessToken = async () => {
    const access_token = process.env.ACCESS_TOKEN
    try {
        await axios.get("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
            headers: {"Authorization" : `Bearer ${access_token}`}
        })
    
        return access_token

    } catch {
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
}

const getProjects = async () => {
    const access_token = await getAccessToken()

    const response = await axios.get("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: {"Authorization" : `Bearer ${access_token}`}
    })

    return response.data.items
}

const getTasksFromProjectId = async (id) => {
    const access_token = await getAccessToken()

    const response = await axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${id}/tasks`, {
        headers: {"Authorization" : `Bearer ${access_token}`}
    })

    return response.data
}

export default { getAccessToken, getProjects, getTasksFromProjectId }