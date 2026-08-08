uniform float time;
uniform float delta;
out vec4 fragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec4 tmpPos = texture2D(texturePosition, uv);
	vec3 position = tmpPos.xyz;
	vec3 velocity = texture2D(textureVelocity, uv).xyz;
	
	float phase = tmpPos.w;
	
	phase = mod(
		phase + delta + length(velocity.xz) * delta * 3. + max(velocity.y, 0.0) * delta * 6.0,
		62.83
	);
	
	fragColor = vec4(position + velocity * delta * 15. , phase);
}
