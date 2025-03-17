import { JobStatus, jobStatusTracker } from "./job-status-tracker";

// Reset the jobStatusTracker before each test
beforeEach(() => {
	// Directly reset the jobs Map to a new empty Map
	jobStatusTracker["jobs"] = new Map();
});

describe("JobStatusTracker", () => {
	// Test constants
	const TEST_USER_ID = "user123";
	const TEST_JOB_TYPE = "constant_contact_sync";

	// Setup for timer-dependent tests
	beforeAll(() => {
		// Enable fake timers for all tests
		jest.useFakeTimers();
	});

	afterAll(() => {
		// Restore real timers after tests
		jest.useRealTimers();
	});

	describe("createJob", () => {
		it("should create a new job with correct initial values", () => {
			// Arrange & Act
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);

			// Assert
			expect(job).toBeDefined();
			expect(job.job_id).toBeDefined();
			expect(job.user_id).toBe(TEST_USER_ID);
			expect(job.type).toBe(TEST_JOB_TYPE);
			expect(job.status).toBe("started");
			expect(job.total_contacts).toBe(0);
			expect(job.processed_contacts).toBe(0);
			expect(job.failed_contacts).toBe(0);
			expect(job.progress_percentage).toBe(0);
			expect(job.start_time).toBeInstanceOf(Date);
			expect(job.last_updated).toBeInstanceOf(Date);
		});

		it("should store the job in the internal Map", () => {
			// Arrange & Act
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);

			// Assert
			const retrievedJob = jobStatusTracker.getJob(job.job_id);
			expect(retrievedJob).toEqual(job);
		});

	});

	describe("getJob", () => {
		it("should return the job if it exists", () => {
			// Arrange
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);

			// Act
			const retrievedJob = jobStatusTracker.getJob(job.job_id);

			// Assert
			expect(retrievedJob).toEqual(job);
		});

		it("should return undefined if the job does not exist", () => {
			// Act
			const retrievedJob = jobStatusTracker.getJob("non-existent-job-id");

			// Assert
			expect(retrievedJob).toBeUndefined();
		});
	});

	describe("updateJob", () => {
		it("should update job properties and return the updated job", () => {
			// Arrange
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);
			const updates: Partial<JobStatus> = {
				status: "in_progress",
				total_contacts: 100,
				processed_contacts: 50,
			};

			// Act
			const updatedJob = jobStatusTracker.updateJob(job.job_id, updates);

			// Assert
			expect(updatedJob).toBeDefined();
			expect(updatedJob?.status).toBe("in_progress");
			expect(updatedJob?.total_contacts).toBe(100);
			expect(updatedJob?.processed_contacts).toBe(50);
			expect(updatedJob?.progress_percentage).toBe(50); // 50/100 = 50%
		});

		it("should update the last_updated timestamp", () => {
			// Arrange
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);
			const originalTimestamp = job.last_updated;

			// Wait a bit to ensure timestamp changes
			jest.advanceTimersByTime(100);

			// Act
			const updatedJob = jobStatusTracker.updateJob(job.job_id, { status: "in_progress" });

			// Assert
			expect(updatedJob?.last_updated).not.toEqual(originalTimestamp);
		});

		it("should calculate progress percentage correctly", () => {
			// Arrange
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);

			// Act - 25% progress
			let updatedJob = jobStatusTracker.updateJob(job.job_id, {
				total_contacts: 200,
				processed_contacts: 50,
			});

			// Assert
			expect(updatedJob?.progress_percentage).toBe(25);

			// Act - 75% progress
			updatedJob = jobStatusTracker.updateJob(job.job_id, {
				processed_contacts: 150,
			});

			// Assert
			expect(updatedJob?.progress_percentage).toBe(75);
		});

		it("should return undefined if the job does not exist", () => {
			// Act
			const updatedJob = jobStatusTracker.updateJob("non-existent-job-id", { status: "in_progress" });

			// Assert
			expect(updatedJob).toBeUndefined();
		});
	});

	describe("failJob", () => {
		it("should mark the job as failed with the provided error message", () => {
			// Arrange
			const job = jobStatusTracker.createJob(TEST_USER_ID, TEST_JOB_TYPE);
			const errorMessage = "Something went wrong!";

			// Act
			const failedJob = jobStatusTracker.failJob(job.job_id, errorMessage);

			// Assert
			expect(failedJob).toBeDefined();
			expect(failedJob?.status).toBe("failed");
			expect(failedJob?.error).toBe(errorMessage);
		});

		it("should return undefined if the job does not exist", () => {
			// Act
			const failedJob = jobStatusTracker.failJob("non-existent-job-id", "Error message");

			// Assert
			expect(failedJob).toBeUndefined();
		});
	});

	describe("getUserJobs", () => {
		it("should return all jobs for a specific user", () => {
			// Arrange - Create test jobs directly in the jobs Map
			const user1JobId1 = "user1-job1";
			const user1JobId2 = "user1-job2";
			const user2JobId = "user2-job1";

			const user1Job1: JobStatus = {
				job_id: user1JobId1,
				user_id: "user1",
				type: TEST_JOB_TYPE,
				status: "started",
				start_time: new Date(),
				last_updated: new Date(),
				total_contacts: 0,
				processed_contacts: 0,
				failed_contacts: 0,
				progress_percentage: 0,
			};

			const user1Job2: JobStatus = {
				job_id: user1JobId2,
				user_id: "user1",
				type: "another_job_type",
				status: "started",
				start_time: new Date(),
				last_updated: new Date(),
				total_contacts: 0,
				processed_contacts: 0,
				failed_contacts: 0,
				progress_percentage: 0,
			};

			const user2Job: JobStatus = {
				job_id: user2JobId,
				user_id: "user2",
				type: TEST_JOB_TYPE,
				status: "started",
				start_time: new Date(),
				last_updated: new Date(),
				total_contacts: 0,
				processed_contacts: 0,
				failed_contacts: 0,
				progress_percentage: 0,
			};

			// Add jobs directly to the map
			jobStatusTracker["jobs"].set(user1JobId1, user1Job1);
			jobStatusTracker["jobs"].set(user1JobId2, user1Job2);
			jobStatusTracker["jobs"].set(user2JobId, user2Job);

			// Act
			const user1JobsList = jobStatusTracker.getUserJobs("user1");
			const user2JobsList = jobStatusTracker.getUserJobs("user2");

			// Assert
			expect(user1JobsList.length).toBe(2);
			expect(user1JobsList).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ job_id: user1JobId1 }),
					expect.objectContaining({ job_id: user1JobId2 }),
				])
			);

			expect(user2JobsList.length).toBe(1);
			expect(user2JobsList[0].job_id).toBe(user2JobId);
		});

		it("should return an empty array if no jobs exist for the user", () => {
			// Act
			const userJobs = jobStatusTracker.getUserJobs("non-existent-user");

			// Assert
			expect(userJobs).toEqual([]);
		});
	});

});
