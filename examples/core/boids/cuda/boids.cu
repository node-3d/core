#define CHUNK_SIZE 256U

#define SPEED_LIMIT 9.0f
#define PREY_RADIUS 150.0f
#define PREY_RADIUS_SQ (PREY_RADIUS * PREY_RADIUS)
#define PI_F 3.14159265358979323846f
#define M2PIF (PI_F * 2.0f)

struct Xyzw {
	float x;
	float y;
	float z;
	float w;
};

struct Vec3 {
	float x;
	float y;
	float z;
};

__device__ Vec3 makeVec3(float x, float y, float z) {
	return { x, y, z };
}

__device__ Vec3 fromXyzw(Xyzw value) {
	return { value.x, value.y, value.z };
}

__device__ Vec3 add(Vec3 a, Vec3 b) {
	return { a.x + b.x, a.y + b.y, a.z + b.z };
}

__device__ Vec3 sub(Vec3 a, Vec3 b) {
	return { a.x - b.x, a.y - b.y, a.z - b.z };
}

__device__ Vec3 mul(Vec3 a, float scale) {
	return { a.x * scale, a.y * scale, a.z * scale };
}

__device__ float dot3(Vec3 a, Vec3 b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

__device__ float length3(Vec3 value) {
	return sqrtf(dot3(value, value));
}

__device__ float lengthXz(Vec3 value) {
	return sqrtf(value.x * value.x + value.z * value.z);
}

__device__ Vec3 normalize3(Vec3 value) {
	const float len = length3(value);

	if (len < 0.000001f) {
		return { 0.0f, 0.0f, 0.0f };
	}

	return mul(value, 1.0f / len);
}

extern "C" __global__
void update(
	const unsigned int count,
	const float dt,
	const float bounds,
	const float predatorX,
	const float predatorY,
	const float separation,
	const float alignment,
	const float cohesion,
	Xyzw* ioPosition,
	Xyzw* ioVelocity
) {
	const unsigned int i = blockIdx.x * blockDim.x + threadIdx.x;
	const unsigned int iLocal = threadIdx.x;
	const bool active = i < count;

	Vec3 velocity = active ? fromXyzw(ioVelocity[i]) : makeVec3(0.0f, 0.0f, 0.0f);
	Vec3 position = active ? fromXyzw(ioPosition[i]) : makeVec3(0.0f, 0.0f, 0.0f);
	float phase = active ? ioPosition[i].w : 0.0f;

	const Vec3 predator = makeVec3(predatorX, predatorY, 0.0f);
	const float zoneRadius = separation + alignment + cohesion;
	const float separationThresh = separation / zoneRadius;
	const float alignmentThresh = (separation + alignment) / zoneRadius;
	const float zoneRadiusSquared = zoneRadius * zoneRadius;
	float limit = SPEED_LIMIT;

	Vec3 dir = sub(predator, position);
	dir.z = 0.0f;
	float distSquared = dot3(dir, dir);

	if (active && distSquared < PREY_RADIUS_SQ) {
		const float f = (distSquared / PREY_RADIUS_SQ - 1.0f) * dt * 100.0f;
		velocity = add(velocity, mul(normalize3(dir), f));
		limit += 5.0f;
	}

	if (active) {
		dir = position;
		dir.y *= 2.5f;
		velocity = sub(velocity, mul(normalize3(dir), dt * 5.0f));
	}

	__shared__ Vec3 positionLocal[CHUNK_SIZE];
	__shared__ Vec3 velocityLocal[CHUNK_SIZE];

	const unsigned int chunkCount = (count + CHUNK_SIZE - 1U) / CHUNK_SIZE;

	for (unsigned int k = 0U; k < chunkCount; k++) {
		const unsigned int idx = k * CHUNK_SIZE + iLocal;

		if (idx < count) {
			positionLocal[iLocal] = fromXyzw(ioPosition[idx]);
			velocityLocal[iLocal] = fromXyzw(ioVelocity[idx]);
		} else {
			positionLocal[iLocal] = makeVec3(0.0f, 0.0f, 0.0f);
			velocityLocal[iLocal] = makeVec3(0.0f, 0.0f, 0.0f);
		}

		__syncthreads();

		if (active) {
			const unsigned int localCount = min(CHUNK_SIZE, count - k * CHUNK_SIZE);

			for (unsigned int j = 0U; j < localCount; j++) {
				const Vec3 birdPosition = positionLocal[j];
				const Vec3 birdVelocity = velocityLocal[j];
				dir = sub(birdPosition, position);
				distSquared = dot3(dir, dir);

				if (distSquared < 0.0001f || distSquared > zoneRadiusSquared) {
					continue;
				}

				const float dist = sqrtf(distSquared);
				const float percent = distSquared / zoneRadiusSquared;

				if (percent < separationThresh) {
					const float f = (separationThresh / percent - 1.0f) * dt;
					velocity = sub(velocity, mul(dir, f / dist));
					continue;
				}

				if (percent < alignmentThresh) {
					const float threshDelta = alignmentThresh - separationThresh;
					const float adjustedPercent = (percent - separationThresh) / threshDelta;
					const float f = (0.5f - cosf(adjustedPercent * M2PIF) * 0.5f + 0.5f) * dt;
					velocity = add(velocity, mul(normalize3(birdVelocity), f));
					continue;
				}

				const float threshDelta = 1.0f - alignmentThresh;
				float adjustedPercent = 1.0f;

				if (threshDelta >= 0.0001f) {
					adjustedPercent = (percent - alignmentThresh) / threshDelta;
				}

				const float f = (0.5f - (cosf(adjustedPercent * M2PIF) * -0.5f + 0.5f)) * dt;
				velocity = add(velocity, mul(dir, f / dist));
			}
		}

		__syncthreads();
	}

	if (!active) {
		return;
	}

	if (length3(velocity) > limit) {
		velocity = mul(normalize3(velocity), limit);
	}

	ioVelocity[i].x = velocity.x;
	ioVelocity[i].y = velocity.y;
	ioVelocity[i].z = velocity.z;

	position = add(position, mul(velocity, dt * 15.0f));
	phase = fmodf(
		phase + dt + lengthXz(velocity) * dt * 3.0f + fmaxf(velocity.y, 0.0f) * dt * 6.0f,
		PI_F * 20.0f
	);

	ioPosition[i].x = position.x;
	ioPosition[i].y = position.y;
	ioPosition[i].z = position.z;
	ioPosition[i].w = phase;
}
