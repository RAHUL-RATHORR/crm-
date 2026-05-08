import JobCard from '../models/JobCard.js';

// Read all jobs from MongoDB
export const getAllJobs = async () => {
  try {
    return await JobCard.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    return [];
  }
};

// Save a new job to MongoDB
export const createJob = async (jobData) => {
  try {
    // Note: Job Number unique constraint is handled by MongoDB schema if defined,
    // otherwise we can check it here. 
    const newJob = new JobCard(jobData);
    return await newJob.save();
  } catch (error) {
    // Mapping MongoDB unique error to match the previous error code
    if (error.code === 11000) {
      const customError = new Error("Job Number already exists");
      customError.code = 11000;
      throw customError;
    }
    throw error;
  }
};

// Delete a job from MongoDB
export const deleteJob = async (id) => {
  try {
    const result = await JobCard.findByIdAndDelete(id);
    return result ? { id } : null;
  } catch (error) {
    console.error('Error in deleteJob:', error);
    throw error;
  }
};

