pipeline {
    agent any

    tools {
        nodejs 'Node18'   // Must match Jenkins → Manage Tools name
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo "Checking Node & NPM version..."
                sh 'node -v'
                sh 'npm -v'

                echo "Installing dependencies..."
                sh 'npm ci'
            }
        }

        stage('Build React App') {
            steps {
                echo "Building React App (CI mode off to ignore warnings)..."
                sh 'CI=false npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker Image..."
                sh 'docker build -t ketan803/movie-frontend:${BUILD_NUMBER} .'
            }
        }

        stage('Docker Push') {
            steps {
                echo "Pushing to Docker Hub..."
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ketan803/movie-frontend:${BUILD_NUMBER}
                    '''
                }
            }
        }
    }
}
