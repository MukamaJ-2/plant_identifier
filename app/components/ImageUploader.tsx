"use client";
import React, { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Image from 'next/image';
import { FaUpload, FaLeaf, FaInfoCircle, FaTable, FaImage, FaQuestionCircle } from 'react-icons/fa';

const API_KEY = "AIzaSyBIzs1i9qgEESHBjUyFHzfiy7gj03ZntdY";

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [plantInfo, setPlantInfo] = useState<string | null>(null);
  const [plantDetails, setPlantDetails] = useState<{ [key: string]: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
      setPlantInfo(null);
      setPlantDetails(null);
      setLoading(true);

      try {
        const imageData = await fileToGenerativePart(file);
        const result = await identifyPlant(imageData);

        const { description, tableData } = parsePlantDetails(result);
        setPlantInfo(description);
        setPlantDetails(tableData);
      } catch (error) {
        console.error('Error identifying plant:', error);
        setPlantInfo('Error identifying plant. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result?.toString().split(",")[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const identifyPlant = async (imageData: any) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Identify this plant and provide its name and other important information. 
    Also, provide a table with the following details: Scientific Name, Family, Origin, Growth Habit, Sun Exposure, Water Needs.
    Format the response as follows:
    Description: [Plant description]
    Table:
    Scientific Name: [value]
    Family: [value]
    Origin: [value]
    Growth Habit: [value]
    Sun Exposure: [value]
    Water Needs: [value]`;

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    return response.text();
  };

  const parsePlantDetails = (text: string) => {
    const [description, tableText] = text.split('Table:');
    const tableLines = tableText.trim().split('\n');
    const tableData: { [key: string]: string } = {};
    tableLines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        tableData[key.trim()] = value.trim();
      }
    });
    return { description: description.replace('Description:', '').trim(), tableData };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ... (rest of the JSX remains the same) */}
      <div className="mb-8">
        <label className="block mb-4">
          <span className="sr-only">Choose plant image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100
              cursor-pointer
            "
          />
        </label>
      </div>
      {/* ... (rest of the JSX) */}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center">
    <div className="text-3xl mb-2 text-green-400">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-300">{description}</p>
  </div>
);

export default ImageUploader;