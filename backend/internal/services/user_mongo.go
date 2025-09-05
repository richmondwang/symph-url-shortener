package services

import (
	"context"
	"errors"
	"time"

	"github.com/richmondwang/symph-url-shortener/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

var _ UserService = (*MongoUserService)(nil)

type MongoUserService struct {
	Coll *mongo.Collection // users collection
}

func NewMongoUserService(coll *mongo.Collection) *MongoUserService {
	return &MongoUserService{Coll: coll}
}

func (s *MongoUserService) Register(ctx context.Context, username, password string) error {
	var existing models.User
	err := s.Coll.FindOne(ctx, bson.M{"username": username}).Decode(&existing)
	if err == nil {
		return errors.New("username already exists")
	}
	if err != mongo.ErrNoDocuments {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user := models.User{
		Username:  username,
		Password:  string(hash),
		CreatedAt: time.Now().UTC(),
	}
	_, err = s.Coll.InsertOne(ctx, user)
	return err
}

func (s *MongoUserService) Login(ctx context.Context, username, password string) (*models.User, error) {
	var user models.User
	err := s.Coll.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)) != nil {
		return nil, errors.New("invalid credentials")
	}
	return &user, nil
}

func (s *MongoUserService) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	err := s.Coll.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
