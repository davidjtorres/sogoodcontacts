/**
 * In-memory job status tracker

 */

export interface JobStatus {
	job_id: string;
	status: "started" | "in_progress" | "completed" | "failed" | "not_found";
	user_id?: string;
	type: string;
	total_contacts: number;
	processed_contacts: number;
	failed_contacts: number;
	progress_percentage: number;
	start_time: Date;
	last_updated: Date;
	error?: string;
}

class JobStatusTracker {
	private jobs: Map<string, JobStatus> = new Map();

	// Create a new job and store its initial status
	createJob(userId: string, jobType: string): JobStatus {
		const job_id = new Date().getTime().toString();
		const newJob: JobStatus = {
			job_id,
			user_id: userId,
			status: "started",
			type: jobType,
			total_contacts: 0,
			processed_contacts: 0,
			failed_contacts: 0,
			progress_percentage: 0,
			start_time: new Date(),
			last_updated: new Date(),
		};

		this.jobs.set(job_id, newJob);
		return newJob;
	}

	// Get a job status by ID
	getJob(jobId: string): JobStatus | undefined {
		return this.jobs.get(jobId);
	}

	// Update a job's status
	updateJob(jobId: string, updates: Partial<JobStatus>): JobStatus | undefined {
		const job = this.jobs.get(jobId);
		if (!job) return undefined;

		// Apply updates
		const updatedJob = {
			...job,
			...updates,
			last_updated: new Date(),
		};

		// Calculate progress percentage if total_contacts has been set
		if (updatedJob.total_contacts > 0) {
			updatedJob.progress_percentage = Math.round((updatedJob.processed_contacts / updatedJob.total_contacts) * 100);
		}

		// Store updated job
		this.jobs.set(jobId, updatedJob);
		return updatedJob;
	}

	// Mark a job as completed
	completeJob(jobId: string, finalStats: { total: number; processed: number; failed: number }): JobStatus | undefined {
		return this.updateJob(jobId, {
			status: "completed",
			total_contacts: finalStats.total,
			processed_contacts: finalStats.processed,
			failed_contacts: finalStats.failed,
			progress_percentage: 100,
		});
	}

	// Mark a job as failed
	failJob(jobId: string, error: string): JobStatus | undefined {
		return this.updateJob(jobId, {
			status: "failed",
			error,
		});
	}

	// Get all jobs for a user
	getUserJobs(userId: string): JobStatus[] {
		return Array.from(this.jobs.values()).filter((job) => job.user_id === userId);
	}

	// Clean up old jobs (could be called periodically)
	cleanupOldJobs(maxAgeHours: number = 24): void {
		const now = new Date();
		const maxAge = maxAgeHours * 60 * 60 * 1000; // convert hours to milliseconds

		for (const [jobId, job] of this.jobs.entries()) {
			const age = now.getTime() - job.last_updated.getTime();
			if (age > maxAge) {
				this.jobs.delete(jobId);
			}
		}
	}
}

// Export a singleton instance
export const jobStatusTracker = new JobStatusTracker();
