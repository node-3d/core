#!/usr/bin/env bash
set -euo pipefail

target_arch="${1:-$(node -p 'process.arch')}"
brew_arch=()
brew_bin="brew"

run_brew() {
	if [[ "${#brew_arch[@]}" -gt 0 ]]; then
		"${brew_arch[@]}" "$brew_bin" "$@"
	else
		"$brew_bin" "$@"
	fi
}

if [[ "$target_arch" == "x64" ]]; then
	brew_arch=("arch" "-x86_64")
	brew_bin="/usr/local/bin/brew"

	if [[ ! -x "$brew_bin" ]]; then
		echo "[mac-gl] installing x86_64 Homebrew into /usr/local"
		NONINTERACTIVE=1 CI=1 "${brew_arch[@]}" /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	fi

	if [[ "${CI:-}" == "true" ]]; then
		for name in idle3 idle3.14 pip3 pip3.14 pydoc3 pydoc3.14 python3 python3-config python3.14 python3.14-config; do
			target="/usr/local/bin/$name"
			if [[ -e "$target" || -L "$target" ]]; then
				rm "$target"
			fi
		done
	fi
fi

echo "[mac-gl] target_arch=$target_arch"
echo "[mac-gl] brew=${brew_arch[*]:-native} $brew_bin"
run_brew untap aws/tap >/dev/null 2>&1 || true
run_brew --version
run_brew config

if ! run_brew install mesa; then
	echo "[mac-gl] brew install mesa returned a non-zero status; checking whether Mesa was still installed"
	if ! run_brew --prefix mesa >/dev/null 2>&1; then
		echo "[mac-gl] Mesa prefix is unavailable after failed install"
		exit 1
	fi
fi

mesa_prefix="$(run_brew --prefix mesa)"
runtime_dir="$PWD/.glfw-runtime-lib"
mkdir -p "$runtime_dir"

link_lib() {
	local name="$1"
	local source="$mesa_prefix/lib/$name"

	if [[ -e "$source" ]]; then
		ln -sf "$source" "$runtime_dir/$name"
	fi
}

link_lib "libEGL.dylib"
link_lib "libEGL.1.dylib"
link_lib "libGLESv2.dylib"
link_lib "libGLESv2.2.dylib"
link_lib "libGL.dylib"
link_lib "libGL.1.dylib"

if [[ ! -e "$runtime_dir/libEGL.dylib" || ! -e "$runtime_dir/libGLESv2.dylib" ]]; then
	echo "[mac-gl] Mesa EGL/GLES dylibs are missing from $mesa_prefix/lib"
	exit 1
fi

for target_dir in node_modules/@node-3d/deps-opengl/bin-darwin-* bin-darwin-*; do
	if [[ -d "$target_dir" ]]; then
		for dylib in "$runtime_dir"/*.dylib; do
			[[ -e "$dylib" ]] || continue
			ln -sf "$dylib" "$target_dir/$(basename "$dylib")"
		done
	fi
done

echo "[mac-gl] mesa=$mesa_prefix"
echo "[mac-gl] runtime=$runtime_dir"
find "$runtime_dir" -maxdepth 1 -type l -print -exec file {} \;
find "$mesa_prefix/lib" -maxdepth 1 -type f -name "lib*.dylib" -print -exec file {} \;

{
	echo "NODE_3D_GLFW_RUNTIME_LIB=$runtime_dir"
	echo "DYLD_LIBRARY_PATH=$runtime_dir:$mesa_prefix/lib:${DYLD_LIBRARY_PATH:-}"
	echo "DYLD_FALLBACK_LIBRARY_PATH=$runtime_dir:$mesa_prefix/lib:${DYLD_FALLBACK_LIBRARY_PATH:-}"
	echo "EGL_PLATFORM=surfaceless"
	echo "LIBGL_ALWAYS_SOFTWARE=1"
	echo "MESA_LOADER_DRIVER_OVERRIDE=llvmpipe"
} >> "$GITHUB_ENV"
