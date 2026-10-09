import subprocess
import sys
import os

def main():
	print("=" * 60)
	print("       COSCORE ECOMMERCE FRONTEND DEV RUNNER")
	print("=" * 60)
	
	script_dir = os.path.dirname(os.path.abspath(__file__))
	
	# Determine package manager (bun or npm)
	pkg_manager = "npm"
	try:
		res = subprocess.run(["bun", "--version"], capture_output=True, text=True)
		if res.returncode == 0:
			pkg_manager = "bun"
	except Exception:
		pass
		
	print(f"[*] Starting Vite Dev Server using '{pkg_manager}'...")
	print(f"[*] Running in directory: {script_dir}")
	print("[*] Press Ctrl+C to terminate the frontend dev server.")
	print("-" * 60)
	
	try:
		# Run npm install or bun install if node_modules doesn't exist
		if not os.path.exists(os.path.join(script_dir, "node_modules")):
			print("[!] 'node_modules' not found. Installing dependencies first...")
			subprocess.run([pkg_manager, "install"], cwd=script_dir, check=True)
			print("[+] Dependencies installed successfully.")
			print("-" * 60)

		# Run the dev command
		subprocess.run([pkg_manager, "run", "dev"], cwd=script_dir, check=True)
	except KeyboardInterrupt:
		print("\n[+] Frontend dev server terminated by user.")
	except subprocess.CalledProcessError as e:
		print(f"\n[!] Error running script command: {e}")
		sys.exit(1)
	except Exception as e:
		print(f"\n[!] Failed to start: {e}")
		sys.exit(1)

if __name__ == "__main__":
	main()
