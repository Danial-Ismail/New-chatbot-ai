import React, { useEffect, useState } from 'react'
import './App.css'
import RoboImg from "./images/Ai-img.avif"
import { RiRobot2Line } from "react-icons/ri";
import API_KEY from './config';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import RehypeRaw from 'rehype-raw';
import RehypeReact from 'rehype-react';
import { AiChat } from '@nlux/react';


export const botStyle = {
    background: 'linear-gradient(yellow, orange)',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export const user = {
    name: 'Alex',
    picture: 'https://nlux.ai/images/demos/persona-user.jpeg'
};


const Chatbot = () => {
    const [userInput, setUserInput] = useState("");
    const [generatedText, setGeneratedText] = useState([]);
    const [generatedImage, setGeneratedImage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [generatedTable, setGeneratedTable] = useState({ data: [] });


    // console.log(userInput);
    useEffect(() => {
        // Display initial message when the component mounts
        setGeneratedText([
            { message: "Hello! How can I help you?", isUser: false }
        ]);
        setIsTyping(false);
    }, []);

    const handleSend = async () => {
        try {
            setGeneratedText((prevState) => [
                ...prevState,
                { message: userInput, isUser: true },
            ]);
            setIsTyping(true)
            setUserInput("");
            const apiEndPoint = "https://api.openai.com/v1/chat/completions";
            const imgApiEndPoint = "https://api.openai.com/v1/images/generations";
            const tableApiEndPoint = "https://api.openai.com/v1/chat/completions";
            // Append user input to the generatedText state


            if (userInput.toLowerCase().includes("table")) {
                const tableResponse = await axios.post(
                    tableApiEndPoint,
                    {
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You will be provided with unstructured data, and your task is to parse it into CSV format."
                            },
                            {
                                role: "user",
                                content: userInput
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 256,
                        top_p: 1
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + API_KEY,
                        }
                    }
                );

                const generatedData = tableResponse.data.choices[0]?.message?.content;
                console.log("Generated Data:", generatedData); // Add this line to log the data

                const csvRows = generatedData.split('\n');
                const csvArray = csvRows.map(row => row.split(','));


                setGeneratedTable(prevState => ({
                    data: [...prevState.data, ...csvArray],
                }));



                console.log("Generated Markdown String:", generateMarkdownString());


            } else if (userInput.toLowerCase().includes("image")) {
                const imageResponse = await axios.post(
                    imgApiEndPoint,
                    {
                        model: "dall-e-3",
                        prompt: userInput,
                        n: 1,
                        size: "1024x1024",
                        response_format: "url"
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + API_KEY,
                        }
                    }
                );
                setGeneratedImage(imageResponse.data)
                console.log(generatedImage);
            } else {
                const textResponse = await axios.post(
                    apiEndPoint,
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: userInput }],
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + API_KEY,
                        }
                    }
                )
                setGeneratedText((prevState) => [
                    ...prevState,
                    { message: textResponse.data.choices[0].message.content, isUser: false },
                ]);

            }


            setIsTyping(false)
            console.log(generatedTable.data)

        } catch (error) {
            console.log(error);
        }


    }
    const generateMarkdownString = () => {
        if (!generatedTable?.data || generatedTable.data.length === 0) {
            return null;
        }

        // Extract header and rows
        const [header, ...rows] = generatedTable.data;

        // Convert the table data into a Markdown-formatted array
        const markdownArray = [
            `| ${header.map(h => `**${h}**`).join(' | ')} |`,
            `| ${Array(header.length).fill(' --- ').join(' | ')} |`,
            ...rows.map(row => `| ${row.join(' | ')} |`),
        ];
        
        console.log("Markdown Array:", markdownArray); // Add this line to log the Markdown array
        return markdownArray.join('\n');
    };






    return (
        <div className='flex'>
            <div className='w-[60%] bg-cover h-screen bg-center'>
                <img src={RoboImg} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className='w-[40%] flex flex-col h-screen'>
                <div className='bg-blue-500 text-white p-4 flex items-center justify-center'>
                    <RiRobot2Line className='mr-2' size={30} />
                    <h1 className='font-bold text-lg'>AI Chatbot</h1>
                </div>
                <div className=' flex-grow p-4 overflow-y-auto custom-scrollbar max-h-screen'>
                    {generatedText.map((message, index) => (
                        <div
                            key={index}
                            className={` p-2 ${message.isUser ? 'text-right' : 'text-left'}`}
                        >
                            <span
                                className={`p-2 rounded-lg inline-block ${message.isUser ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'
                                    }`}
                            >
                                {message.message}
                            </span>
                        </div>
                    ))}
                    {isTyping && <div className='text-left p-2'><span className='p-2 rounded-lg inline-block bg-gray-200 text-gray-800'>AI is typing...</span></div>}
                    {generatedTable.data.length > 0 && (
                        <>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[RehypeReact]}
                                components={{
                                    table: ({ node, ...props }) => (
                                        <table className='table-auto w-full' {...props} />
                                    ),
                                    th: ({ node, ...props }) => (
                                        <th className='bg-blue-500 text-white p-2 font-bold ' {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                        <td className='border p-2' {...props} />
                                    ),
                                }}
                            >
                                {generateMarkdownString()}
                            </ReactMarkdown>
                        </>
                    )}
                </div>
                <div className='p-4 flex items-end'>
                    <input type='text' placeholder='Type your message...' value={userInput} className='border p-2 flex-1 mr-2 focus:outline-none' onChange={(e) => setUserInput(e.target.value)} />
                    <button className='bg-blue-500 text-white p-2 hover:bg-blue-700' onClick={handleSend}>Send</button>
                </div>
            </div>
        </div>
    )
}


export default Chatbot