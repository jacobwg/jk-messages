class Message < ActiveRecord::Base
  attr_accessible :body, :facebook_id, :local_id, :sender, :time

  def self.import
    thread_id = '510521608973600'
    access_token = 'AAACEdEose0cBAPouYu4Gt7PMAozKzKts46mYdB1P5eixcr0T0kmW0UZBGPk7k7tMrrZBpFR4ZCy3IA7saPx7PmQosAnVZAGd9WDDU8k6xd89uQZC1NxZAG'

    g = Koala::Facebook::API.new(access_token)

    fql = 'SELECT message_count FROM thread WHERE thread_id=510521608973600'
    message_count = FbGraph::Query.new(fql).fetch(access_token).first['message_count']

    (1...message_count).each do |i|
      next unless Message.where(:local_id => i).empty?
      puts "Fetching message #{i}"
      message = g.get_object("#{thread_id}_#{i}")
      puts message
      next if message['message'].nil?
      message = Message.new(:facebook_id => message['id'], :local_id => i, :sender => message['from']['name'], :body => message['message'], :time => DateTime.parse(message['created_time']))
      message.save
    end
  end
end
