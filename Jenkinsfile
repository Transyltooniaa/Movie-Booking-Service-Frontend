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
                    credentialsId: 'docker_creds',
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
        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    echo "Switching to Minikube context..."
                    sudo -n -u ketan /snap/bin/kubectl config use-context minikube

                    echo "Updating image..."
                    sudo -n -u ketan /snap/bin/kubectl set image deployment/movie-frontend movie-frontend=ketan803/movie-frontend:${BUILD_NUMBER} -n movie-app

                    echo "Waiting for rollout..."
                    sudo -n -u ketan /snap/bin/kubectl rollout status deployment/movie-frontend -n movie-app
                """
            }
        }
    }
}
